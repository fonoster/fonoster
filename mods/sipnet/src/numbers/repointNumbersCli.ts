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
import SDK from "@routr/sdk";
import { createNumberRouting, EngineRoutingConfig } from "./engineRouting";
import { repointNumbers, RoutrNumbersClient } from "./repointNumbers";

/**
 * Moves app-linked Numbers created before the rebuild (pointing at Asterisk's sip:voice@default)
 * to the media-node peer:
 *
 *   node dist/numbers/repointNumbersCli.js <routing.json> [--apply] [--app <ref>]...
 *
 * routing.json holds an EngineRoutingConfig ({ mediaNodeAor }); `{}` uses sip:medianode@default.
 * Without --apply it only prints what would change. ROUTR_API_ENDPOINT (default routr:51907)
 * points at Routr's API.
 */
async function main(argv: string[]) {
  const file = argv[0];
  if (!file) {
    console.error(
      "usage: repointNumbersCli <routing.json> [--apply] [--app <ref>]..."
    );
    process.exit(2);
  }
  const config = JSON.parse(
    fs.readFileSync(file, "utf8")
  ) as EngineRoutingConfig;
  const appRefs = argv
    .map((a, i) => (a === "--app" ? argv[i + 1] : undefined))
    .filter((a): a is string => !!a);
  const client = new SDK.Numbers({
    endpoint: process.env.ROUTR_API_ENDPOINT ?? "routr:51907",
    insecure: true
  }) as unknown as RoutrNumbersClient;
  const changes = await repointNumbers(client, createNumberRouting(config), {
    dryRun: !argv.includes("--apply"),
    appRefs: appRefs.length ? appRefs : undefined
  });
  console.log(
    JSON.stringify({ applied: argv.includes("--apply"), changes }, null, 2)
  );
}

main(process.argv.slice(2)).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
