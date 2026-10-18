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
import * as fs from "fs";
import * as path from "path";
import { RegionHub } from "@fonoster/common";

export type HubInitOptions = {
  /** The leaf listener's certificate and key, as the hub's NATS server will see them. */
  leafTls?: { certFile: string; keyFile: string };
  /** Generate a hub with no TLS on the leaf port (local stacks only). */
  allowNoTls?: boolean;
  leafPort?: number;
};

export type HubInitResult = {
  /** Files written by this run, relative to `dir`. */
  created: string[];
  /** Files that already existed and were left alone. */
  kept: string[];
};

export const HUB_FILES = {
  conf: "region-hub.conf",
  signingKey: path.join("keys", "region-signing.pem"),
  operatorSeed: path.join("keys", "region-hub", "operator.seed"),
  accountSeed: path.join("keys", "region-hub", "account.seed"),
  controlPlaneCreds: path.join("keys", "region-hub", "control-plane.creds"),
  systemCreds: path.join("keys", "region-hub", "system.creds")
};

/**
 * Generates what a region hub needs (RG-B2), once: the hub's NATS config (operator mode, a leaf
 * listener with TLS), the operator and REGIONS account seeds, the control plane's two credentials
 * files and the ES256 region-signing key. Every file is written 0600. Existing files are never
 * overwritten, so running it again is safe: the NATS material is generated together (it is keyed on
 * region-hub.conf), the signing key on its own.
 */
export function initHub(dir: string, options: HubInitOptions): HubInitResult {
  if (!options.leafTls && !options.allowNoTls)
    throw new Error(
      "the hub's leaf port needs TLS: pass --leaf-tls-cert and --leaf-tls-key (the paths the hub's NATS server sees), or --allow-no-tls for a local stack"
    );
  if (
    options.leafTls &&
    (!options.leafTls.certFile || !options.leafTls.keyFile)
  )
    throw new Error("--leaf-tls-cert and --leaf-tls-key go together");

  const result: HubInitResult = { created: [], kept: [] };
  const write = (rel: string, content: string) => {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, { mode: 0o600 });
    result.created.push(rel);
  };

  if (fs.existsSync(path.join(dir, HUB_FILES.signingKey)))
    result.kept.push(HUB_FILES.signingKey);
  else {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    write(
      HUB_FILES.signingKey,
      privateKey.export({ type: "pkcs8", format: "pem" }).toString()
    );
  }

  if (fs.existsSync(path.join(dir, HUB_FILES.conf))) {
    result.kept.push(HUB_FILES.conf);
    return result;
  }
  const hub = RegionHub.generateRegionHub({
    leafTls: options.leafTls,
    leafPort: options.leafPort
  });
  // The config goes last: its presence marks the NATS material as complete.
  write(HUB_FILES.operatorSeed, hub.operatorSeed);
  write(HUB_FILES.accountSeed, hub.accountSeed);
  write(HUB_FILES.controlPlaneCreds, hub.controlPlaneCreds);
  write(HUB_FILES.systemCreds, hub.systemCreds);
  write(HUB_FILES.conf, hub.conf);
  return result;
}

/** What to do after `hub init`, for the operator. */
export function hubNextSteps(dir: string, leafPort = 7422): string {
  return `Next steps:
  1. Run a NATS server with ${path.join(dir, HUB_FILES.conf)} as its config (the leaf listener is on
     port ${leafPort}) and open that port to your regions; the TLS certificate must cover the name
     regions dial. Keep the hub's data directory (/data/jwt) on a volume.
  2. Point the control plane at it, in the API server's regions config:
       signingKey: { file: <dir>/${HUB_FILES.signingKey} }
       leafUrl: "tls://<your domain>:${leafPort}"
       hub: { url: "nats://<hub>:4222",
              credentialsFile: <dir>/${HUB_FILES.controlPlaneCreds},
              systemCredentialsFile: <dir>/${HUB_FILES.systemCreds},
              operatorSeedFile: <dir>/${HUB_FILES.operatorSeed},
              accountSeedFile: <dir>/${HUB_FILES.accountSeed} }
     With Helm: store region-hub.conf in natsRegions.configSecret, keys/region-hub/* in
     apiserver.regionHubSecret and region-signing.pem in apiserver.keysSecret.
  3. Make the files readable by the services that use them (they are written 0600).
  4. Keep ${path.join(dir, "keys", "region-hub")} secret and backed up: the seeds mint credentials
     for any region.
Then create a region and enroll its machine: fonoster-region create <id> --name <name>.`;
}
