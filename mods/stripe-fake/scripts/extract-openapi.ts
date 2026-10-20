/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Writes spec/stripe.subset.json: the paths the fake serves, and every schema they reference, from
 * Stripe's public OpenAPI spec at the pinned release (add-stripe-fake D2). PR CI then needs no
 * network, and a diff shows exactly what changed when the pin moves.
 *
 *   npm run extract:openapi -w mods/stripe-fake -- <path to spec3.json>
 *
 * Without a path it downloads spec3.json at OPENAPI_RELEASE.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/** The stripe/openapi release matching the pinned API version (stripe@23.0.0's OPENAPI_VERSION). */
export const OPENAPI_RELEASE = "v2526";

/** The paths the fake serves (D2). Keep sorted; adding one is how the fake grows. */
export const SERVED_PATHS = [
  "/v1/billing/credit_balance_summary",
  "/v1/billing/credit_balance_transactions",
  "/v1/billing/credit_balance_transactions/{id}",
  "/v1/billing/credit_grants",
  "/v1/billing/credit_grants/{id}",
  "/v1/billing/credit_grants/{id}/expire",
  "/v1/billing/credit_grants/{id}/void",
  "/v1/billing/meter_event_adjustments",
  "/v1/billing/meter_events",
  "/v1/billing/meters",
  "/v1/billing/meters/{id}",
  "/v1/billing/meters/{id}/deactivate",
  "/v1/billing/meters/{id}/event_summaries",
  "/v1/billing/meters/{id}/reactivate",
  "/v1/customers",
  "/v1/customers/{customer}",
  "/v1/customers/{customer}/payment_methods",
  "/v1/events",
  "/v1/events/{id}",
  "/v1/invoiceitems",
  "/v1/invoices",
  "/v1/invoices/{invoice}",
  "/v1/invoices/{invoice}/finalize",
  "/v1/invoices/{invoice}/pay",
  "/v1/invoices/{invoice}/void",
  "/v1/payment_intents",
  "/v1/payment_intents/{intent}",
  "/v1/payment_intents/{intent}/cancel",
  "/v1/payment_intents/{intent}/confirm",
  "/v1/payment_methods",
  "/v1/payment_methods/{payment_method}",
  "/v1/payment_methods/{payment_method}/attach",
  "/v1/payment_methods/{payment_method}/detach",
  "/v1/prices",
  "/v1/prices/{price}",
  "/v1/products",
  "/v1/products/{id}",
  "/v1/refunds",
  "/v1/refunds/{refund}",
  "/v1/setup_intents",
  "/v1/setup_intents/{intent}",
  "/v1/setup_intents/{intent}/confirm",
  "/v1/subscriptions",
  "/v1/subscriptions/{subscription_exposed_id}",
  "/v1/test_helpers/test_clocks",
  "/v1/test_helpers/test_clocks/{test_clock}",
  "/v1/test_helpers/test_clocks/{test_clock}/advance",
  "/v1/webhook_endpoints",
  "/v1/webhook_endpoints/{webhook_endpoint}"
];

type Json = Record<string, unknown>;

function refsIn(value: unknown, found: Set<string>) {
  if (Array.isArray(value)) value.forEach((v) => refsIn(v, found));
  else if (value && typeof value === "object") {
    Object.entries(value as Json).forEach(([k, v]) => {
      if (k === "$ref" && typeof v === "string")
        found.add(v.replace("#/components/schemas/", ""));
      else refsIn(v, found);
    });
  }
}

export function extract(spec: Json): Json {
  const allPaths = spec.paths as Json;
  const paths = Object.fromEntries(
    SERVED_PATHS.map((p) => {
      if (!allPaths[p]) throw new Error(`path ${p} is not in the spec`);
      return [p, allPaths[p]];
    })
  );
  const all = (spec.components as { schemas: Json }).schemas;
  const keep = new Set<string>();
  const queue = new Set<string>();
  refsIn(paths, queue);
  while (queue.size) {
    const [name] = queue;
    queue.delete(name);
    if (keep.has(name)) continue;
    keep.add(name);
    const found = new Set<string>();
    refsIn(all[name], found);
    found.forEach((n) => !keep.has(n) && queue.add(n));
  }
  const schemas = Object.fromEntries([...keep].sort().map((n) => [n, all[n]]));
  return {
    openapi: spec.openapi,
    info: { ...(spec.info as Json), "x-fonoster-release": OPENAPI_RELEASE },
    paths,
    components: { schemas }
  };
}

async function main(file?: string) {
  const text = file
    ? readFileSync(file, "utf8")
    : await (
        await fetch(
          `https://raw.githubusercontent.com/stripe/openapi/${OPENAPI_RELEASE}/openapi/spec3.json`
        )
      ).text();
  const subset = extract(JSON.parse(text));
  writeFileSync(
    join(__dirname, "../spec/stripe.subset.json"),
    JSON.stringify(subset) + "\n"
  );
  console.log(
    `wrote ${Object.keys(subset.paths as Json).length} paths, ${Object.keys((subset.components as { schemas: Json }).schemas).length} schemas (${(subset.info as Json).version})`
  );
}

if (require.main === module) void main(process.argv[2]);
