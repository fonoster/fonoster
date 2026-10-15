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
import {
  InMemoryApplicationStore,
  migrateApplications,
  toGatewayApps
} from "./migrateApplications";
import { ApplicationMigrationStore, LegacyApplication } from "./types";

/**
 * Migrates legacy Applications to the new app model (docs/operators/cutover.md):
 *
 *   node dist/applications/migration/cli.js --autopilot-url wss://autopilot.example.com/session \
 *     [--apply] [--from-json legacy.json] [--gateway-apps apps.json] [--app <ref>]... \
 *     [--default-voice deepgram/aura-2-thalia-en] [--default-language en-US] [--fallback-message "..."]
 *     [--autopilot-secret-env AUTOPILOT_SIGNING_SECRET]
 *
 * Without --apply nothing is written to the database. --from-json reads an exported array of
 * Application rows instead of the database. --gateway-apps writes the gateway's `apps:` list
 * (JSON, valid YAML; it holds signing secrets, so it is written with mode 0600).
 * The report on stdout never contains secrets.
 */
function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main(argv: string[]) {
  const apply = argv.includes("--apply");
  const fromJson = arg(argv, "--from-json");
  const refs = argv
    .map((a, i) => (a === "--app" ? argv[i + 1] : undefined))
    .filter((a): a is string => !!a);

  let store: ApplicationMigrationStore;
  if (fromJson) {
    store = new InMemoryApplicationStore(
      JSON.parse(fs.readFileSync(fromJson, "utf8")) as LegacyApplication[]
    );
  } else {
    // Loaded lazily: the database client reads fonoster.yaml.
    const { prisma } = await import("../../core/db");
    const { PrismaApplicationStore } = await import("./PrismaApplicationStore");
    store = new PrismaApplicationStore(prisma as never);
  }

  const report = await migrateApplications(store, {
    dryRun: !apply || !!fromJson,
    refs: refs.length ? refs : undefined,
    autopilotUrl: arg(argv, "--autopilot-url"),
    defaults: {
      voice: arg(argv, "--default-voice") ?? "deepgram/aura-2-thalia-en",
      language: arg(argv, "--default-language") ?? "en-US"
    },
    fallbackMessage: arg(argv, "--fallback-message"),
    // The hosted Autopilot's secret, by environment variable name (never on the command line).
    autopilotSigningSecret: arg(argv, "--autopilot-secret-env")
      ? process.env[arg(argv, "--autopilot-secret-env")!]
      : undefined
  });

  const gatewayApps = arg(argv, "--gateway-apps");
  if (gatewayApps) {
    fs.writeFileSync(
      gatewayApps,
      JSON.stringify({ apps: toGatewayApps(report.migrated) }, null, 2),
      { mode: 0o600 }
    );
  }

  console.log(
    JSON.stringify(
      {
        applied: apply && !fromJson,
        migrated: report.migrated.map(({ signingSecret: _s, ...a }) => a),
        skipped: report.skipped,
        notices: report.notices
      },
      null,
      2
    )
  );
}

main(process.argv.slice(2)).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
