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
import {
  AuthzHandler,
  CheckMethodAuthorizedRequest,
  SessionDecision,
  VoiceRequest
} from "@fonoster/authz";
import { getLogger } from "@fonoster/logger";
import { ActiveCalls } from "./activeCalls";
import { Clock } from "./clock";
import { PlanSettings } from "./config";
import { PrismaClient } from "./db";
import { OwnerDirectory } from "./directory";
import { grant, overdraftLimit } from "./ledger";
import { credits } from "./money";

const logger = getLogger({ service: "billing", filePath: __filename });

const DAY_MS = 24 * 3600_000;

/**
 * The owner's billing account; a new owner starts on the Trial with its credits (billing "Plans").
 */
export async function ensureAccount(
  prisma: PrismaClient,
  ownerRef: string,
  plans: PlanSettings,
  now: Date
) {
  const existing = await prisma.billingAccount.findUnique({
    where: { ownerRef }
  });
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const [account] = await tx.billingAccount.createManyAndReturn({
      data: [{ ownerRef, plan: "trial", billingStartedAt: now }],
      skipDuplicates: true
    });
    // Another replica created it at the same moment.
    if (!account)
      return tx.billingAccount.findUniqueOrThrow({ where: { ownerRef } });
    await grant(tx, account.id, {
      kind: "trial_grant",
      amount: credits(plans.trialCredits),
      source: `trial:${account.id}`,
      expiresAt: new Date(now.getTime() + plans.trialDays * DAY_MS)
    });
    return account;
  });
}

/**
 * Admission from the ledger (add-billing-service D7, billing "Admission from the ledger"): never
 * calls Stripe. Methods are not billing's to authorize.
 */
export class BillingAuthzHandler implements AuthzHandler {
  constructor(
    private readonly deps: {
      prisma: PrismaClient;
      directory: OwnerDirectory;
      activeCalls: ActiveCalls;
      plans: PlanSettings;
      clock: Clock;
    }
  ) {}

  async checkSessionAuthorized(
    request: VoiceRequest
  ): Promise<SessionDecision> {
    const { prisma, directory, activeCalls, plans, clock } = this.deps;
    const owner = request.accessKeyId
      ? await directory.ownerOf(request.accessKeyId)
      : undefined;
    if (!owner) {
      // Apps without a workspace (configured in AppBridge's file) are not billed.
      logger.verbose("session of a workspace with no owner admitted", {
        accessKeyId: request.accessKeyId
      });
      return { authorized: true };
    }
    const account = await ensureAccount(prisma, owner, plans, clock.now());
    // A Trial past its 30 days: nothing runs until the owner subscribes, whatever the balance.
    if (account.status === "ended")
      return { authorized: false, reason: "trial_ended" };
    const snapshot = await prisma.balanceSnapshot.findUnique({
      where: { accountId: account.id }
    });
    const balance = snapshot?.balance ?? 0n;
    if (balance + (await overdraftLimit(prisma, account, plans)) <= 0n)
      return { authorized: false, reason: "insufficient_balance" };
    if (
      activeCalls.count(owner) >=
      plans.concurrency[account.plan as "trial" | "payg"]
    )
      return { authorized: false, reason: "concurrency_limit" };
    return { authorized: true };
  }

  async checkMethodAuthorized(_: CheckMethodAuthorizedRequest) {
    return true;
  }

  async addBillingMeterEvent() {
    // Usage reaches billing as stored usage (D2), not through Authz.
  }
}
