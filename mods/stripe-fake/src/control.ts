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
import { StripeError } from "./errors";
import { Json, PaymentOutcome, StripeFake } from "./fake";
import { advance, resetBilling } from "./resources/billing";

const OUTCOMES: PaymentOutcome[] = [
  "succeed",
  "decline",
  "requires_action",
  "timeout"
];

/**
 * The control API (add-stripe-fake D6), only under /_fake/: never reachable through /v1, so a
 * client pointed at real Stripe gets a 404 instead of changing state.
 */
export async function control(
  fake: StripeFake,
  method: string,
  path: string,
  body: Json
): Promise<unknown> {
  const parts = path
    .replace(/^\/_fake\/?/, "")
    .split("/")
    .filter(Boolean);
  const route = `${method.toUpperCase()} ${parts.map((p, i) => ((i % 2 === 1 && parts[i - 1] === "customers") || (i === 2 && parts[0] === "webhooks" && parts[1] === "replay") ? ":id" : p)).join("/")}`;
  switch (route) {
    case "GET state":
      return state(fake);
    case "POST reset":
      fake.reset();
      resetBilling();
      return { ok: true };
    case "GET snapshot":
      return fake.snapshot();
    case "POST restore":
      fake.restore(body);
      return { ok: true };
    case "POST clock/advance": {
      const seconds = Number(body.seconds ?? 0);
      if (!(seconds > 0))
        throw new StripeError(
          400,
          "invalid_request_error",
          "seconds must be a positive number.",
          { param: "seconds" }
        );
      const target = fake.now() + seconds;
      advance(fake, null, target);
      fake
        .all("test_helpers.test_clock")
        .forEach((c) =>
          advance(fake, c.id as string, (c.frozen_time as number) + seconds)
        );
      await fake.deliverDue();
      return { now: fake.now() };
    }
    case "POST customers/:id/next_payment": {
      const customer = parts[1];
      fake.get(customer, "customer", "customer");
      const outcome = body.outcome as PaymentOutcome;
      if (!OUTCOMES.includes(outcome))
        throw new StripeError(
          400,
          "invalid_request_error",
          `outcome must be one of ${OUTCOMES.join(", ")}.`,
          { param: "outcome" }
        );
      fake.nextPayment.set(customer, outcome);
      return { customer, outcome };
    }
    case "POST webhooks/fail_next":
      fake.failWebhooks = Number(body.n ?? 1);
      return { failNext: fake.failWebhooks };
    case "POST webhooks/replay/:id":
      await fake.replay(parts[2]);
      return { replayed: parts[2] };
    case "POST meters/inject_error_report": {
      const meter = body.meter
        ? fake.get(body.meter as string, "billing meter", "meter")
        : undefined;
      fake.emitThin(
        "v1.billing.meter.error_report_triggered",
        meter
          ? {
              id: meter.id,
              type: "billing.meter",
              url: `/v1/billing/meters/${meter.id}`
            }
          : { id: "", type: "billing.meter", url: "" },
        {
          developer_message_summary: `There is 1 invalid event: ${body.code ?? "meter_event_customer_not_found"}`,
          reason: {
            error_count: 1,
            error_types: [
              {
                code: body.code ?? "meter_event_customer_not_found",
                error_count: 1,
                sample_errors: []
              }
            ]
          }
        }
      );
      await fake.deliverDue();
      return { ok: true };
    }
    case "POST latency":
      fake.latencyMs = Number(body.ms ?? 0);
      return { latencyMs: fake.latencyMs };
    case "POST rate_limit":
      fake.rateLimit = body.on === true || body.on === "true";
      return { rateLimit: fake.rateLimit };
    case "POST config":
      if (body.grace_seconds !== undefined)
        fake.graceSeconds = Number(body.grace_seconds);
      if (body.tax_rates !== undefined)
        fake.taxRates = body.tax_rates as Record<string, number>;
      return { graceSeconds: fake.graceSeconds, taxRates: fake.taxRates };
    default:
      throw new StripeError(
        404,
        "invalid_request_error",
        `Unrecognized control request: ${method.toUpperCase()} ${path}`
      );
  }
}

/** Everything the viewer shows (D7). */
export function state(fake: StripeFake): Json {
  const by = (object: string) => fake.all(object);
  return {
    now: fake.now(),
    clocks: by("test_helpers.test_clock"),
    customers: by("customer"),
    paymentMethods: by("payment_method"),
    subscriptions: by("subscription"),
    invoices: by("invoice"),
    meters: by("billing.meter"),
    meterEvents: fake.meterEvents.slice(-200),
    creditGrants: by("billing.credit_grant"),
    creditTransactions: by("billing.credit_balance_transaction"),
    events: fake.events.slice(-200),
    deliveries: fake.deliveries.slice(-200),
    control: {
      failWebhooks: fake.failWebhooks,
      latencyMs: fake.latencyMs,
      rateLimit: fake.rateLimit,
      nextPayment: Object.fromEntries(fake.nextPayment)
    }
  };
}
