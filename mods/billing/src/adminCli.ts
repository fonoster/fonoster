#!/usr/bin/env node
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
import { createPrismaClient as identityClient } from "@fonoster/identity";
import { addCredits } from "./addCredits";
import { loadBillingConfig } from "./config";
import { createPrismaClient } from "./db";
import { OperatorError, setTrialDays } from "./trial";

// `fonoster-billing-admin`: an operator's changes to one owner's billing account (billing "The
// Trial ends", "An operator adds credits"). The owner is `--email` (looked up in Identity) or
// `--owner <user ref>`; `--config` picks billing.yaml as for the service.
//
//   fonoster-billing-admin trial   --email pedro@acme.com --days 45
//   fonoster-billing-admin credits --email pedro@acme.com --credits 500 [--note "support case 123"]

const USAGE = [
  "usage: fonoster-billing-admin trial   (--email <email> | --owner <ref>) --days <n>",
  "       fonoster-billing-admin credits (--email <email> | --owner <ref>) --credits <n> [--note <text>]",
  "       [--config <billing.yaml>]"
].join("\n");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const command = process.argv[2];
  const email = arg("email");
  const ownerArg = arg("owner");
  const value = command === "trial" ? arg("days") : arg("credits");
  if (
    !["trial", "credits"].includes(command) ||
    (!email && !ownerArg) ||
    value === undefined
  )
    throw new OperatorError(USAGE);
  const config = loadBillingConfig();
  let owner = ownerArg;
  if (email) {
    if (!config.identity)
      throw new OperatorError(
        "--email needs the identity section in billing.yaml; use --owner"
      );
    const identity = identityClient(
      config.identity.databaseUrl,
      config.identity.encryptionKey
    );
    const user = await identity.user.findUnique({ where: { email } });
    await identity.$disconnect();
    if (!user) throw new OperatorError(`no user with email ${email}`);
    owner = user.ref;
  }
  const who = email ?? owner;
  const prisma = createPrismaClient(config.database.url);
  try {
    if (command === "trial") {
      const change = await setTrialDays(
        prisma,
        owner!,
        Number(value),
        config.plans,
        new Date()
      );
      console.log(
        `Trial of ${who}: ${value} days, ends ${change.endsAt.toISOString()}; ` +
          `${Number(change.remaining) / 1000} credits left` +
          (change.reopened ? " (reopened)" : "")
      );
    } else {
      const added = await addCredits(
        prisma,
        owner!,
        Number(value),
        config.plans,
        new Date(),
        arg("note")
      );
      console.log(
        `Added ${value} credits to ${who} (${added.plan === "trial" ? "Trial credits" : "like a top-up"}), ` +
          `expiring ${added.expiresAt.toISOString()}`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof OperatorError ? e.message : e);
  process.exit(1);
});
