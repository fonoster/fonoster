/*
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
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import { billingConfigSchema } from "../../../mods/billing/src/config";

// Billing as an opt-in overlay (#1235): compose.billing.yaml adds the billing service; the base
// install runs none and only gains its NATS user; Envoy routes Stripe's webhooks to it.

const BUNDLE = path.join(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(BUNDLE, p), "utf8");
const yaml = (p: string) => parse(read(p));

/** Every file the archive ships from ops/bundle (its tests stay in the repository). */
function shipped(dir = BUNDLE): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "test" ? [] : shipped(p);
    return [p];
  });
}

describe("@bundle[billing overlay]", function () {
  it("runs no billing in the base compose.yaml, only its NATS password", function () {
    const base = yaml("compose.yaml");
    expect(base.services).not.to.have.property("billing");
    expect(base.services.nats.environment.NATS_BILLING_PASSWORD).to.equal(
      "${NATS_BILLING_PASSWORD:?run ./init.sh}"
    );
  });

  it("adds billing without postgres and refuses to start without the Stripe values", function () {
    const { billing } = yaml("compose.billing.yaml").services;
    expect(billing.image).to.equal(
      "fonoster/billing:${FONOSTER_VERSION:?set FONOSTER_VERSION}"
    );
    expect(Object.keys(billing.depends_on).sort()).to.deep.equal([
      "apiserver",
      "nats"
    ]);
    expect(billing.environment.STRIPE_SECRET_KEY).to.equal(
      "${STRIPE_SECRET_KEY:?set STRIPE_SECRET_KEY in .env}"
    );
    expect(billing.environment.STRIPE_WEBHOOK_SECRET).to.equal(
      "${STRIPE_WEBHOOK_SECRET:?set STRIPE_WEBHOOK_SECRET in .env}"
    );
    expect(billing.healthcheck.test).to.deep.equal([
      "CMD",
      "node",
      "/work/mods/billing/dist/healthcheck.js"
    ]);
  });

  it("ships a billing.yaml with the 7-day Trial and every secret as a ${NAME}", function () {
    const text = read("config/billing.yaml");
    const config = billingConfigSchema.parse(parse(text));
    expect(config.plans).to.include({ trialDays: 7, trialCredits: 1000 });
    expect(config.rateCards.dir).to.equal("/work/mods/billing/rate-cards");
    expect(config.stripe).to.include({
      secretKey: "${STRIPE_SECRET_KEY}",
      webhookSecret: "${STRIPE_WEBHOOK_SECRET}",
      automaticTax: true
    });
    expect(config.database.url).to.equal("${BILLING_DATABASE_URL}");
  });

  it("routes POST /stripe/webhooks to billing:50072 before the / matches, in both Envoy files", function () {
    for (const file of ["config/envoy.yaml", "config/envoy-tls.yaml"]) {
      const { static_resources: envoy } = yaml(file);
      const listener = envoy.listeners.find(
        (l: { name: string }) => l.name !== "listener_http_redirect"
      );
      const routes = listener.filter_chains[0].filters[0].typed_config
        .route_config.virtual_hosts[0].routes as {
        match: { path?: string; prefix?: string };
        route: { cluster: string };
      }[];
      const webhooks = routes.findIndex(
        (r) => r.match.path === "/stripe/webhooks"
      );
      expect(webhooks, file).to.be.greaterThan(-1);
      expect(routes[webhooks].route.cluster, file).to.equal("billing-cluster");
      expect(
        routes.findIndex((r) => r.match.prefix === "/"),
        file
      ).to.be.greaterThan(webhooks);
      const cluster = envoy.clusters.find(
        (c: { name: string }) => c.name === "billing-cluster"
      );
      expect(
        cluster.load_assignment.endpoints[0].lb_endpoints[0].endpoint.address
          .socket_address,
        file
      ).to.deep.equal({ address: "billing", port_value: 50072 });
    }
  });

  it("gives NATS the billing user with its permissions file", function () {
    const conf = read("config/nats.conf");
    expect(conf).to.contain("include ./nats-permissions/billing.conf");
    expect(conf).to.contain(
      "{ user: billing, password: $NATS_BILLING_PASSWORD, permissions: $BILLING_PERMISSIONS }"
    );
    expect(read("config/nats-permissions/billing.conf")).to.contain(
      "BILLING_PERMISSIONS = {"
    );
  });

  it("names neither the test stack nor its variables in anything the archive ships", function () {
    const named = shipped().filter((f) =>
      /rebuild|RB_/i.test(fs.readFileSync(f, "utf8"))
    );
    expect(named).to.deep.equal([]);
  });
});
