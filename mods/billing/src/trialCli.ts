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
import { loadBillingConfig } from "./config";
import { createPrismaClient } from "./db";
import { setTrialDays, TrialError } from "./trial";

// `fonoster-billing-trial`: sets how many days an owner's Trial lasts (billing "The Trial ends"),
// counted from its start. The default for new owners is `plans.trialDays` in billing.yaml.
//
//   fonoster-billing-trial --email pedro@acme.com --days 45 [--config /etc/fonoster/billing.yaml]
//   fonoster-billing-trial --owner <user ref> --days 45

const USAGE =
  "usage: fonoster-billing-trial (--email <email> | --owner <user ref>) --days <n> [--config <file>]";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email");
  const ownerArg = arg("owner");
  const daysArg = arg("days");
  if ((!email && !ownerArg) || daysArg === undefined)
    throw new TrialError(USAGE);
  const config = loadBillingConfig();
  let owner = ownerArg;
  if (email) {
    if (!config.identity)
      throw new TrialError(
        "--email needs the identity section in billing.yaml; use --owner"
      );
    const identity = identityClient(
      config.identity.databaseUrl,
      config.identity.encryptionKey
    );
    const user = await identity.user.findUnique({ where: { email } });
    await identity.$disconnect();
    if (!user) throw new TrialError(`no user with email ${email}`);
    owner = user.ref;
  }
  const prisma = createPrismaClient(config.database.url);
  try {
    const change = await setTrialDays(
      prisma,
      owner!,
      Number(daysArg),
      config.plans,
      new Date()
    );
    console.log(
      `Trial of ${email ?? owner}: ${daysArg} days, ends ${change.endsAt.toISOString()}; ` +
        `${Number(change.remaining) / 1000} credits left` +
        (change.reopened ? " (reopened)" : "")
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof TrialError ? e.message : e);
  process.exit(1);
});
