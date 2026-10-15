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
import { generateKeyPairSync } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { generateRegionHub } from "../regions/natsJwt";

/**
 * fonoster-region-hub-setup <dir> [--leaf-tls <cert> <key>]
 *
 * Generates, once, what private regions need on the control plane side (RG-B2):
 *   <dir>/region-hub.conf               the hub's NATS config (operator mode, leaf listener)
 *   <dir>/keys/region-signing.pem       the ES256 region-signing key (enrollment tokens)
 *   <dir>/keys/region-hub/*.seed|.creds the operator and REGIONS account seeds and the control
 *                                       plane's REGIONS and system users
 * Existing files are left alone. Keep the seeds secret: they mint region credentials.
 */
function main(argv: string[]) {
  const dir = argv[0];
  if (!dir) {
    process.stderr.write(
      "usage: fonoster-region-hub-setup <dir> [--leaf-tls <cert> <key>]\n"
    );
    process.exit(2);
  }
  const tlsAt = argv.indexOf("--leaf-tls");
  const leafTls =
    tlsAt >= 0
      ? { certFile: argv[tlsAt + 1], keyFile: argv[tlsAt + 2] }
      : undefined;
  const hubDir = join(dir, "keys", "region-hub");
  mkdirSync(hubDir, { recursive: true });

  const signing = join(dir, "keys", "region-signing.pem");
  if (!existsSync(signing)) {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    writeFileSync(
      signing,
      privateKey.export({ type: "pkcs8", format: "pem" }),
      {
        mode: 0o600
      }
    );
  }

  const conf = join(dir, "region-hub.conf");
  if (!existsSync(conf)) {
    const hub = generateRegionHub({ leafTls });
    const secret = { mode: 0o600 };
    writeFileSync(join(hubDir, "operator.seed"), hub.operatorSeed, secret);
    writeFileSync(join(hubDir, "account.seed"), hub.accountSeed, secret);
    writeFileSync(
      join(hubDir, "control-plane.creds"),
      hub.controlPlaneCreds,
      secret
    );
    writeFileSync(join(hubDir, "system.creds"), hub.systemCreds, secret);
    writeFileSync(conf, hub.conf);
  }
  process.stdout.write(`region hub material in ${dir}\n`);
}

main(process.argv.slice(2));
