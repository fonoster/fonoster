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
import Stripe from "stripe";
import { PlanSettings } from "../config";

/** Prices are found by these lookup keys, so setting up twice changes nothing. */
export const PLAN_LOOKUP_KEY = "fonoster_cloud_payg";
export const USAGE_LOOKUP_KEY = "fonoster_cloud_usage";
/** Billable usage reaches Stripe in milli-credits on this meter (D5). */
export const USAGE_METER_EVENT = "fonoster_usage_milli_credits";
/** One milli-credit in cents: $0.00001. */
export const MILLI_CREDIT_CENTS = "0.001";

export type StripeCatalog = {
  product: string;
  planPrice: string;
  usagePrice: string;
  meter: string;
};

/**
 * Finds or creates what Stripe needs (D8): the product, the monthly plan price, the usage meter
 * and the metered usage price.
 */
export async function ensureCatalog(
  stripe: Stripe,
  plans: PlanSettings
): Promise<StripeCatalog> {
  const prices = (
    await stripe.prices.list({
      lookup_keys: [PLAN_LOOKUP_KEY, USAGE_LOOKUP_KEY],
      limit: 10
    })
  ).data;
  let plan = prices.find((p) => p.lookup_key === PLAN_LOOKUP_KEY);
  let usage = prices.find((p) => p.lookup_key === USAGE_LOOKUP_KEY);
  let meter = (await stripe.billing.meters.list({ limit: 100 })).data.find(
    (m) => m.event_name === USAGE_METER_EVENT && m.status === "active"
  );
  const productId =
    (plan?.product as string | undefined) ??
    (usage?.product as string | undefined) ??
    (await stripe.products.create({ name: "Fonoster Cloud" })).id;
  meter ??= await stripe.billing.meters.create({
    display_name: "Usage (milli-credits)",
    event_name: USAGE_METER_EVENT,
    default_aggregation: { formula: "sum" }
  });
  plan ??= await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: plans.planFeeCents,
    recurring: { interval: "month" },
    lookup_key: PLAN_LOOKUP_KEY
  });
  usage ??= await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount_decimal: Stripe.Decimal.from(MILLI_CREDIT_CENTS),
    recurring: { interval: "month", usage_type: "metered", meter: meter.id },
    lookup_key: USAGE_LOOKUP_KEY
  });
  return {
    product: productId,
    planPrice: plan.id,
    usagePrice: usage.id,
    meter: meter.id
  };
}
