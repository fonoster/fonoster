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
import { Usage } from "@fonoster/common";
import { credits } from "./money";
import { priceOf, RateCard } from "./rateCards";
import { RecordedUsage } from "./usage";

export type RatedReason =
  | "before_billing"
  | "private_region"
  | "byok"
  | "included"
  | "limit_only"
  | "platform_minutes"
  | "platform_key"
  | "addon"
  | "unpriced";

export type InvoiceCategory = "platform_minutes" | "ai_usage" | "addons";

export type Rated = {
  billable: boolean;
  reason: RatedReason;
  /** Milli-credits, rounded once, half up (D5). */
  amount: bigint;
  rateCardVersion?: number;
  category?: InvoiceCategory;
};

/** The shortest call billed (D4, rule 6). */
export const MIN_CALL_SECONDS = 15;

const INCLUDED = new Set([
  "amd.detections",
  "amd.seconds",
  "recording.seconds",
  "storage.bytes"
]);
const AI = /^(stt|tts|llm|embedding)\./;

const free = (reason: RatedReason): Rated => ({
  billable: false,
  reason,
  amount: 0n
});

const isVendor = (meter: string) =>
  Usage.isMeter(meter) && Usage.meterOf(meter).vendor;

/**
 * Rates one usage event (add-billing-service D4): fixed rules, first match wins. Pure: the same
 * usage, account start and card always give the same line.
 */
export function rate(
  usage: RecordedUsage,
  billingStartedAt: Date,
  card: RateCard | undefined
): Rated {
  if (new Date(usage.occurredAt).getTime() < billingStartedAt.getTime())
    return free("before_billing");
  if (usage.regionKind === "private") return free("private_region");
  if (isVendor(usage.meter) && usage.keySource === "workspace")
    return free("byok");
  if (INCLUDED.has(usage.meter)) return free("included");
  if (usage.meter === "calls.concurrent") return free("limit_only");

  let quantity = usage.quantity;
  let reason: RatedReason;
  let category: InvoiceCategory;
  if (usage.meter === "call.seconds") {
    quantity = Math.max(MIN_CALL_SECONDS, quantity);
    reason = "platform_minutes";
    category = "platform_minutes";
  } else if (AI.test(usage.meter)) {
    reason = "platform_key";
    category = "ai_usage";
  } else if (usage.meter === "nc.seconds") {
    reason = "addon";
    category = "addons";
  } else return free("unpriced");

  const unit = card
    ? priceOf(card, usage.meter, usage.provider, usage.model)
    : undefined;
  if (unit === undefined) return free("unpriced");
  return {
    billable: true,
    reason,
    amount: credits(unit * quantity),
    rateCardVersion: card!.version,
    category
  };
}
