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

/**
 * Stripe's test payment methods (add-stripe-fake 2.1, 4.2). A magic id names a behavior; using it
 * creates a real-looking pm_ object that keeps the behavior.
 */
const TEST_METHODS: Record<
  string,
  { brand: string; last4: string; behavior: Behavior }
> = {
  pm_card_visa: { brand: "visa", last4: "4242", behavior: "succeed" },
  pm_card_mastercard: {
    brand: "mastercard",
    last4: "4444",
    behavior: "succeed"
  },
  pm_card_chargeDeclined: {
    brand: "visa",
    last4: "0002",
    behavior: "generic_decline"
  },
  pm_card_chargeDeclinedInsufficientFunds: {
    brand: "visa",
    last4: "9995",
    behavior: "insufficient_funds"
  },
  pm_card_authenticationRequired: {
    brand: "visa",
    last4: "3184",
    behavior: "requires_action"
  }
};

type Behavior =
  "succeed" | "generic_decline" | "insufficient_funds" | "requires_action";

/** Turns a magic id into a pm_ object, or returns the existing payment method. */
export function paymentMethod(
  fake: StripeFake,
  id: string,
  param = "payment_method"
): Json {
  const magic = TEST_METHODS[id];
  if (!magic) return fake.get(id, "PaymentMethod", param);
  return fake.create("payment_method", "pm", {
    object: "payment_method",
    type: "card",
    customer: null,
    billing_details: {
      address: null,
      email: null,
      name: null,
      phone: null,
      tax_id: null
    },
    card: {
      brand: magic.brand,
      last4: magic.last4,
      exp_month: 12,
      exp_year: 2034,
      funding: "credit",
      country: "US",
      checks: null,
      wallet: null,
      networks: null,
      three_d_secure_usage: { supported: true },
      generated_from: null,
      display_brand: magic.brand,
      regulated_status: null
    },
    metadata: { fake_behavior: magic.behavior },
    allow_redisplay: "unspecified"
  });
}

const DECLINES: Record<
  string,
  { code: string; decline_code: string; message: string }
> = {
  generic_decline: {
    code: "card_declined",
    decline_code: "generic_decline",
    message: "Your card was declined."
  },
  insufficient_funds: {
    code: "card_declined",
    decline_code: "insufficient_funds",
    message: "Your card has insufficient funds."
  },
  requires_action: {
    code: "authentication_required",
    decline_code: "authentication_required",
    message: "Your card was declined. This transaction requires authentication."
  }
};

/** The outcome of charging a payment method, honoring a forced next outcome for the customer. */
function outcomeFor(
  fake: StripeFake,
  customer: string | null,
  pm: Json
): Behavior | "timeout" {
  const forced = customer ? fake.nextPayment.get(customer) : undefined;
  if (forced && customer) {
    fake.nextPayment.delete(customer);
    return forced === "succeed"
      ? "succeed"
      : forced === "decline"
        ? "generic_decline"
        : forced;
  }
  return ((pm.metadata as Json)?.fake_behavior as Behavior) ?? "succeed";
}

/**
 * Creates and confirms a payment intent for an amount (invoices and direct payments). Emits Stripe's
 * events in order; returns the intent and, on failure, the Stripe error.
 */
export function charge(
  fake: StripeFake,
  args: {
    customer: string | null;
    amount: number;
    currency: string;
    paymentMethod: string | null;
    offSession: boolean;
    invoice?: string;
    metadata?: Json;
    description?: string | null;
  }
): { intent: Json; error?: StripeError } {
  const clock = fake.clockOf(args.customer);
  const intent = fake.create(
    "payment_intent",
    "pi",
    {
      object: "payment_intent",
      amount: args.amount,
      amount_received: 0,
      amount_capturable: 0,
      currency: args.currency,
      customer: args.customer,
      payment_method: args.paymentMethod,
      status: "requires_confirmation",
      capture_method: "automatic",
      confirmation_method: "automatic",
      payment_method_types: ["card"],
      metadata: args.metadata ?? {},
      description: args.description ?? null,
      last_payment_error: null,
      latest_charge: null,
      next_action: null,
      setup_future_usage: null,
      fake_invoice: args.invoice ?? null
    },
    clock
  );
  fake.emit("payment_intent.created", intent, undefined, clock);
  if (!args.paymentMethod) {
    fake.update(intent, { status: "requires_payment_method" });
    return { intent };
  }
  return confirm(fake, intent, args.offSession);
}

export function confirm(
  fake: StripeFake,
  intent: Json,
  offSession: boolean
): { intent: Json; error?: StripeError } {
  const clock = fake.clockOf(intent.customer as string | null);
  const pm = paymentMethod(fake, intent.payment_method as string);
  if (pm.id !== intent.payment_method)
    fake.update(intent, { payment_method: pm.id });
  const outcome = outcomeFor(fake, intent.customer as string | null, pm);
  if (outcome === "timeout")
    return {
      intent,
      error: new StripeError(
        500,
        "api_error",
        "An error occurred while processing your request (forced timeout)."
      )
    };
  if (outcome === "succeed") {
    const ch = fake.create(
      "charge",
      "ch",
      {
        object: "charge",
        amount: intent.amount,
        amount_captured: intent.amount,
        amount_refunded: 0,
        currency: intent.currency,
        customer: intent.customer,
        payment_intent: intent.id,
        payment_method: pm.id,
        paid: true,
        captured: true,
        refunded: false,
        status: "succeeded",
        metadata: {}
      },
      clock
    );
    const previous = fake.update(intent, {
      status: "succeeded",
      amount_received: intent.amount,
      latest_charge: ch.id
    });
    fake.emit("charge.succeeded", ch, undefined, clock);
    fake.emit("payment_intent.succeeded", intent, previous, clock);
    return { intent };
  }
  const decline = DECLINES[outcome];
  const needsAction = outcome === "requires_action" && !offSession;
  const lastError = {
    type: "card_error",
    code: decline.code,
    decline_code: decline.decline_code,
    message: decline.message,
    payment_method: pm
  };
  const previous = fake.update(intent, {
    status: needsAction ? "requires_action" : "requires_payment_method",
    last_payment_error: lastError,
    next_action: needsAction
      ? { type: "use_stripe_sdk", use_stripe_sdk: {} }
      : null
  });
  fake.emit(
    needsAction
      ? "payment_intent.requires_action"
      : "payment_intent.payment_failed",
    intent,
    previous,
    clock
  );
  if (needsAction) return { intent };
  return {
    intent,
    error: new StripeError(402, "card_error", decline.message, {
      code: decline.code,
      decline_code: decline.decline_code,
      payment_intent: intent
    })
  };
}

export const paymentRoutes: Route[] = [
  // ---- payment methods ----
  {
    method: "post",
    path: "/v1/payment_methods",
    handler: ({ fake, body }) => {
      if (body.type && body.type !== "card")
        throw new StripeError(
          400,
          "invalid_request_error",
          "The fake supports card payment methods only.",
          { param: "type" }
        );
      return paymentMethod(
        fake,
        (body.payment_method as string) ?? "pm_card_visa"
      );
    }
  },
  {
    method: "get",
    path: "/v1/payment_methods/{payment_method}",
    handler: ({ fake, params }) => paymentMethod(fake, params.payment_method)
  },
  {
    method: "post",
    path: "/v1/payment_methods/{payment_method}/attach",
    handler: ({ fake, params, body }) => {
      if (!body.customer) throw missing("customer");
      const customer = fake.get(
        body.customer as string,
        "customer",
        "customer"
      );
      const pm = paymentMethod(fake, params.payment_method);
      const previous = fake.update(pm, { customer: customer.id });
      fake.emit(
        "payment_method.attached",
        pm,
        previous,
        fake.clockOf(customer.id as string)
      );
      return pm;
    }
  },
  {
    method: "post",
    path: "/v1/payment_methods/{payment_method}/detach",
    handler: ({ fake, params }) => {
      const pm = fake.get(
        params.payment_method,
        "PaymentMethod",
        "payment_method"
      );
      const previous = fake.update(pm, { customer: null });
      fake.emit("payment_method.detached", pm, previous);
      return pm;
    }
  },
  {
    method: "get",
    path: "/v1/payment_methods",
    handler: ({ fake, body }) =>
      list(
        "/v1/payment_methods",
        fake.all(
          "payment_method",
          (p) => !body.customer || p.customer === body.customer
        ),
        body
      )
  },
  // ---- setup intents ----
  {
    method: "post",
    path: "/v1/setup_intents",
    handler: ({ fake, body }) => {
      const customer = (body.customer as string) ?? null;
      if (customer) fake.get(customer, "customer", "customer");
      const clock = fake.clockOf(customer);
      const si = fake.create(
        "setup_intent",
        "seti",
        {
          object: "setup_intent",
          customer,
          payment_method: null,
          payment_method_types: ["card"],
          status: "requires_payment_method",
          usage: (body.usage as string) ?? "off_session",
          metadata: metadataOf(body),
          client_secret: fake.secret("seti_secret"),
          last_setup_error: null,
          next_action: null
        },
        clock
      );
      fake.emit("setup_intent.created", si, undefined, clock);
      if (body.payment_method && body.confirm === "true")
        return confirmSetup(fake, si, body.payment_method as string);
      if (body.payment_method)
        fake.update(si, {
          payment_method: body.payment_method,
          status: "requires_confirmation"
        });
      return si;
    }
  },
  {
    method: "get",
    path: "/v1/setup_intents/{intent}",
    handler: ({ fake, params }) =>
      fake.get(params.intent, "setupintent", "intent")
  },
  {
    method: "post",
    path: "/v1/setup_intents/{intent}/confirm",
    handler: ({ fake, params, body }) => {
      const si = fake.get(params.intent, "setupintent", "intent");
      const pm =
        (body.payment_method as string) ?? (si.payment_method as string);
      if (!pm) throw missing("payment_method");
      return confirmSetup(fake, si, pm);
    }
  },
  // ---- payment intents ----
  {
    method: "post",
    path: "/v1/payment_intents",
    handler: ({ fake, body }) => {
      const amount = int(body.amount);
      if (amount === undefined) throw missing("amount");
      if (!body.currency) throw missing("currency");
      const customer = (body.customer as string) ?? null;
      if (customer) fake.get(customer, "customer", "customer");
      const pm = (body.payment_method as string) ?? null;
      if (body.confirm !== "true") {
        const clock = fake.clockOf(customer);
        const intent = fake.create(
          "payment_intent",
          "pi",
          {
            object: "payment_intent",
            amount,
            amount_received: 0,
            currency: body.currency,
            customer,
            payment_method: pm,
            status: pm ? "requires_confirmation" : "requires_payment_method",
            capture_method: "automatic",
            confirmation_method: "automatic",
            payment_method_types: ["card"],
            metadata: metadataOf(body),
            description: body.description ?? null
          },
          clock
        );
        fake.emit("payment_intent.created", intent, undefined, clock);
        return intent;
      }
      const { intent, error } = charge(fake, {
        customer,
        amount,
        currency: body.currency as string,
        paymentMethod: pm,
        offSession: body.off_session === "true",
        metadata: metadataOf(body),
        description: (body.description as string) ?? null
      });
      if (error) throw error;
      return intent;
    }
  },
  {
    method: "get",
    path: "/v1/payment_intents/{intent}",
    handler: ({ fake, params }) =>
      fake.get(params.intent, "payment_intent", "intent")
  },
  {
    method: "post",
    path: "/v1/payment_intents/{intent}/confirm",
    handler: ({ fake, params, body }) => {
      const intent = fake.get(params.intent, "payment_intent", "intent");
      if (body.payment_method)
        fake.update(intent, { payment_method: body.payment_method });
      if (!intent.payment_method) throw missing("payment_method");
      const { error } = confirm(fake, intent, body.off_session === "true");
      if (error) throw error;
      return intent;
    }
  },
  {
    method: "post",
    path: "/v1/payment_intents/{intent}/cancel",
    handler: ({ fake, params }) => {
      const intent = fake.get(params.intent, "payment_intent", "intent");
      const previous = fake.update(intent, {
        status: "canceled",
        canceled_at: fake.now(fake.clockOf(intent.customer as string))
      });
      fake.emit("payment_intent.canceled", intent, previous);
      return intent;
    }
  },
  // ---- refunds ----
  {
    method: "post",
    path: "/v1/refunds",
    handler: ({ fake, body }) => {
      const intent = body.payment_intent
        ? fake.get(
            body.payment_intent as string,
            "payment_intent",
            "payment_intent"
          )
        : undefined;
      const chargeId =
        (body.charge as string) ?? (intent?.latest_charge as string);
      if (!chargeId) throw missing("payment_intent");
      const ch = fake.get(chargeId, "charge", "charge");
      const left =
        (ch.amount_captured as number) - (ch.amount_refunded as number);
      const amount = int(body.amount, left)!;
      if (amount > left)
        throw new StripeError(
          400,
          "invalid_request_error",
          `Refund amount ($${(amount / 100).toFixed(2)}) is greater than unrefunded amount on charge ($${(left / 100).toFixed(2)})`,
          { param: "amount" }
        );
      const clock = fake.clockOf(ch.customer as string);
      const refund = fake.create(
        "refund",
        "re",
        {
          object: "refund",
          amount,
          charge: ch.id,
          currency: ch.currency,
          payment_intent: ch.payment_intent,
          status: "succeeded",
          reason: body.reason ?? null,
          metadata: metadataOf(body)
        },
        clock
      );
      const previous = fake.update(ch, {
        amount_refunded: (ch.amount_refunded as number) + amount,
        refunded: (ch.amount_refunded as number) + amount === ch.amount_captured
      });
      fake.emit("charge.refunded", ch, previous, clock);
      fake.emit("refund.created", refund, undefined, clock);
      return refund;
    }
  },
  {
    method: "get",
    path: "/v1/refunds/{refund}",
    handler: ({ fake, params }) => fake.get(params.refund, "refund", "refund")
  }
];

function confirmSetup(fake: StripeFake, si: Json, pmId: string): Json {
  const pm = paymentMethod(fake, pmId);
  const clock = fake.clockOf(si.customer as string | null);
  const behavior = (pm.metadata as Json)?.fake_behavior;
  if (behavior === "requires_action") {
    const previous = fake.update(si, {
      payment_method: pm.id,
      status: "requires_action",
      next_action: { type: "use_stripe_sdk", use_stripe_sdk: {} }
    });
    fake.emit("setup_intent.requires_action", si, previous, clock);
    return si;
  }
  if (si.customer) {
    const prevPm = fake.update(pm, { customer: si.customer });
    fake.emit("payment_method.attached", pm, prevPm, clock);
  }
  const previous = fake.update(si, {
    payment_method: pm.id,
    status: "succeeded"
  });
  fake.emit("setup_intent.succeeded", si, previous, clock);
  return si;
}
