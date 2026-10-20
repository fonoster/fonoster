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
// Fonoster Cloud's billing (billing.proto), for the workspace owner. Amounts are credits
// (1 credit = $0.01). There is no owner field: the account is always the caller's.

/** Where credits came from: the plan, a top-up or the Trial. */
type CreditSource = {
  /** plan, topup or trial */
  kind: string;
  credits: number;
  /** ISO 8601; empty when they don't expire */
  expiresAt: string;
};

type BillingSummary = {
  /** trial or payg */
  plan: string;
  /** active, past_due or closed */
  status: string;
  /** Credits; negative while in the overdraft */
  balance: number;
  /** How far below zero the balance may go, in credits */
  overdraft: number;
  sources: CreditSource[];
  /** ISO 8601; empty on the Trial */
  periodEnd: string;
  autoRecharge: boolean;
  rechargeThreshold: number;
  rechargeAmount: number;
};

type UpdateAutoRechargeRequest = {
  enabled: boolean;
  /** Recharge when the balance falls below this many credits */
  threshold: number;
  /** Credits bought each time (at least the smallest top-up) */
  amount: number;
};

type CreateTopUpRequest = {
  /** Credits to buy (at least the smallest top-up); tax is added on top */
  credits: number;
};

type CreatePortalSessionRequest = {
  /** Where the Stripe Customer Portal sends the owner back to */
  returnUrl: string;
};

type CreatePortalSessionResponse = {
  url: string;
};

export {
  BillingSummary,
  CreateTopUpRequest,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
  CreditSource,
  UpdateAutoRechargeRequest
};
