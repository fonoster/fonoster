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
import * as fs from "fs";
import { toGatewayApps } from "../applications/migration";
import { arg, optionsFromArgv } from "./argv";
import { migrateLegacy } from "./migrateLegacy";

// fonoster-migrate-legacy: the one-time cutover migration (docs/operators/cutover.md, section 2).
// Dry run by default; --apply writes. Secrets never go on the command line or in the output.

const USAGE = `usage: fonoster-migrate-legacy [--apply] --autopilot-url <wss://...>
  [--autopilot-secret-env <ENV>] [--app <ref>]... [--default-voice <id>] [--default-language <tag>]
  [--fallback-message <text>] [--gateway-apps <file>] [--allow-insecure-webhooks]
  [--integrations <integrations.json> --credentials-out <file> [--secrets-dir <dir>]]`;

async function main(argv: string[]) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return;
  }
  const options = optionsFromArgv(argv);
  // Loaded lazily: the database client reads fonoster.yaml (and the encryption key).
  const { prisma } = await import("../core/db");
  const report = await migrateLegacy(prisma, options);

  const gatewayApps = arg(argv, "--gateway-apps");
  if (gatewayApps) {
    fs.writeFileSync(
      gatewayApps,
      JSON.stringify({ apps: toGatewayApps(report.apps) }, null, 2),
      { mode: 0o600 }
    );
  }
  console.log(
    JSON.stringify({ applied: !options.dryRun, steps: report.steps }, null, 2)
  );
  await prisma.$disconnect();
}

main(process.argv.slice(2)).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
