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
import { missing, StripeError } from "../errors";
import { Json, StripeFake } from "../fake";
import { int, list, metadataOf, Route } from "../router";

/** At most this many unused grants per customer, as on Stripe. */
const MAX_UNUSED_GRANTS = 100;

const monetary = (value: number, currency = "usd") => ({
  monetary: { currency, value },
  type: "monetary"
});

/** What is left on a grant: its amount minus every debit recorded against it. */
export function remaining(fake: StripeFake, grant: Json): number {
  const amount = ((grant.amount as Json).monetary as Json).value as number;
  const used = fake
    .all(
      "billing.credit_balance_transaction",
      (t) => t.credit_grant === grant.id && t.type === "debit"
    )
    .reduce(
      (n, t) =>
        n +
        ((((t.debit as Json).amount as Json).monetary as Json).value as number),
      0
    );
  return amount - used;
}

/** Whether a grant can pay at a moment: effective, not expired, not voided. */
function usable(grant: Json, at: number): boolean {
  return (
    !grant.voided_at &&
    (grant.effective_at as number) <= at &&
    (grant.expires_at === null || (grant.expires_at as number) > at)
  );
}

/**
 * Applies a customer's grants to an amount of metered usage at invoice finalization, in Stripe's
 * order: priority, then earlier expiry, then promotional before paid, then earlier effective date.
 * Records one debit per grant used and returns them (D4, spec "Credit grants apply …").
 */
export function applyCredits(
  fake: StripeFake,
  customer: string,
  amount: number,
  at: number,
  invoice: string,
  clock: string | null
): Json[] {
  const grants = fake
    .all(
      "billing.credit_grant",
      (g) => g.customer === customer && usable(g, at) && remaining(fake, g) > 0
    )
    .sort(
      (a, b) =>
        (a.priority as number) - (b.priority as number) ||
        ((a.expires_at as number) ?? Infinity) -
          ((b.expires_at as number) ?? Infinity) ||
        (a.category === b.category
          ? 0
          : a.category === "promotional"
            ? -1
            : 1) ||
        (a.effective_at as number) - (b.effective_at as number)
    );
  const debits: Json[] = [];
  let due = amount;
  for (const grant of grants) {
    if (due <= 0) break;
    const take = Math.min(due, remaining(fake, grant));
    due -= take;
    const tx = fake.create(
      "billing.credit_balance_transaction",
      "cbtxn",
      {
        object: "billing.credit_balance_transaction",
        customer,
        credit_grant: grant.id,
        effective_at: at,
        type: "debit",
        credit: null,
        debit: {
          amount: monetary(take),
          type: "credits_applied",
          credits_applied: { invoice, invoice_line_item: null }
        },
        test_clock: clock
      },
      clock
    );
    fake.emit(
      "billing.credit_balance_transaction.created",
      tx,
      undefined,
      clock
    );
    debits.push(tx);
  }
  return debits;
}

/** Expires grants whose time has come: what was left is debited as expired (D4). */
export function expireGrants(
  fake: StripeFake,
  at: number,
  clock: string | null
) {
  fake
    .all(
      "billing.credit_grant",
      (g) =>
        g.expires_at !== null &&
        (g.expires_at as number) <= at &&
        !g.fake_expired &&
        fake.clockOf(g.customer as string) === clock
    )
    .forEach((grant) => {
      grant.fake_expired = true;
      const left = remaining(fake, grant);
      if (left > 0) {
        const tx = fake.create(
          "billing.credit_balance_transaction",
          "cbtxn",
          {
            object: "billing.credit_balance_transaction",
            customer: grant.customer,
            credit_grant: grant.id,
            effective_at: grant.expires_at,
            type: "debit",
            credit: null,
            debit: {
              amount: monetary(left),
              type: "credits_expired",
              credits_applied: null
            },
            test_clock: clock
          },
          clock
        );
        fake.emit(
          "billing.credit_balance_transaction.created",
          tx,
          undefined,
          clock
        );
      }
      fake.emit("billing.credit_grant.updated", grant, undefined, clock);
    });
}

export const creditRoutes: Route[] = [
  {
    method: "post",
    path: "/v1/billing/credit_grants",
    handler: ({ fake, body }) => {
      if (!body.customer) throw missing("customer");
      const customer = fake.get(
        body.customer as string,
        "customer",
        "customer"
      );
      const value = int(((body.amount as Json)?.monetary as Json)?.value);
      if (value === undefined) throw missing("amount[monetary][value]");
      const priceType =
        (((body.applicability_config as Json)?.scope as Json)
          ?.price_type as string) ?? undefined;
      if (!priceType) throw missing("applicability_config[scope][price_type]");
      if (!body.category) throw missing("category");
      const unused = fake.all(
        "billing.credit_grant",
        (g) =>
          g.customer === customer.id && remaining(fake, g) > 0 && !g.voided_at
      );
      if (unused.length >= MAX_UNUSED_GRANTS)
        throw new StripeError(
          400,
          "invalid_request_error",
          "A customer can have at most 100 unused credit grants."
        );
      const clock = fake.clockOf(customer.id as string);
      const now = fake.now(clock);
      const grant = fake.create(
        "billing.credit_grant",
        "credgr",
        {
          object: "billing.credit_grant",
          customer: customer.id,
          amount: monetary(
            value,
            ((body.amount as Json).monetary as Json).currency as string
          ),
          applicability_config: {
            scope: { price_type: priceType, prices: [] }
          },
          category: body.category,
          name: body.name ?? null,
          metadata: metadataOf(body),
          priority: int(body.priority, 50),
          effective_at: int(body.effective_at, now),
          expires_at: int(body.expires_at) ?? null,
          voided_at: null,
          test_clock: clock,
          updated: now
        },
        clock
      );
      fake.emit("billing.credit_grant.created", grant, undefined, clock);
      const tx = fake.create(
        "billing.credit_balance_transaction",
        "cbtxn",
        {
          object: "billing.credit_balance_transaction",
          customer: customer.id,
          credit_grant: grant.id,
          effective_at: grant.effective_at,
          type: "credit",
          credit: {
            amount: monetary(value),
            type: "credits_granted",
            credits_application_invoice_voided: null
          },
          debit: null,
          test_clock: clock
        },
        clock
      );
      fake.emit(
        "billing.credit_balance_transaction.created",
        tx,
        undefined,
        clock
      );
      return grant;
    }
  },
  {
    method: "get",
    path: "/v1/billing/credit_grants/{id}",
    handler: ({ fake, params }) => fake.get(params.id, "credit grant")
  },
  {
    method: "post",
    path: "/v1/billing/credit_grants/{id}",
    handler: ({ fake, params, body }) => {
      const grant = fake.get(params.id, "credit grant");
      const fields: Json = {};
      if (body.expires_at !== undefined)
        fields.expires_at =
          body.expires_at === "" ? null : int(body.expires_at);
      if (body.metadata !== undefined)
        fields.metadata = metadataOf(body, grant.metadata as Json);
      const previous = fake.update(grant, {
        ...fields,
        updated: fake.now(fake.clockOf(grant.customer as string))
      });
      fake.emit(
        "billing.credit_grant.updated",
        grant,
        previous,
        fake.clockOf(grant.customer as string)
      );
      return grant;
    }
  },
  {
    method: "post",
    path: "/v1/billing/credit_grants/{id}/expire",
    handler: ({ fake, params }) => {
      const grant = fake.get(params.id, "credit grant");
      const clock = fake.clockOf(grant.customer as string);
      const now = fake.now(clock);
      fake.update(grant, { expires_at: now, updated: now });
      expireGrants(fake, now, clock);
      return grant;
    }
  },
  {
    method: "post",
    path: "/v1/billing/credit_grants/{id}/void",
    handler: ({ fake, params }) => {
      const grant = fake.get(params.id, "credit grant");
      if (
        remaining(fake, grant) !==
        ((grant.amount as Json).monetary as Json).value
      )
        throw new StripeError(
          400,
          "invalid_request_error",
          "Only an unused credit grant can be voided; expire it instead."
        );
      const clock = fake.clockOf(grant.customer as string);
      const previous = fake.update(grant, {
        voided_at: fake.now(clock),
        updated: fake.now(clock)
      });
      fake.emit("billing.credit_grant.updated", grant, previous, clock);
      return grant;
    }
  },
  {
    method: "get",
    path: "/v1/billing/credit_grants",
    handler: ({ fake, body }) =>
      list(
        "/v1/billing/credit_grants",
        fake.all(
          "billing.credit_grant",
          (g) => !body.customer || g.customer === body.customer
        ),
        body
      )
  },
  {
    method: "get",
    path: "/v1/billing/credit_balance_summary",
    handler: ({ fake, body }) => {
      if (!body.customer) throw missing("customer");
      fake.get(body.customer as string, "customer", "customer");
      const at = fake.now(fake.clockOf(body.customer as string));
      const grants = fake.all(
        "billing.credit_grant",
        (g) => g.customer === body.customer
      );
      const available = grants
        .filter((g) => usable(g, at))
        .reduce((n, g) => n + remaining(fake, g), 0);
      const ledger = grants
        .filter((g) => !g.voided_at && !g.fake_expired)
        .reduce((n, g) => n + remaining(fake, g), 0);
      return {
        object: "billing.credit_balance_summary",
        customer: body.customer,
        customer_account: null,
        livemode: false,
        balances: [
          {
            available_balance: monetary(available),
            ledger_balance: monetary(ledger)
          }
        ]
      };
    }
  },
  {
    method: "get",
    path: "/v1/billing/credit_balance_transactions",
    handler: ({ fake, body }) => {
      if (!body.customer) throw missing("customer");
      return list(
        "/v1/billing/credit_balance_transactions",
        fake.all(
          "billing.credit_balance_transaction",
          (t) =>
            t.customer === body.customer &&
            (!body.credit_grant || t.credit_grant === body.credit_grant)
        ),
        body
      );
    }
  },
  {
    method: "get",
    path: "/v1/billing/credit_balance_transactions/{id}",
    handler: ({ fake, params }) =>
      fake.get(params.id, "credit balance transaction")
  }
];
