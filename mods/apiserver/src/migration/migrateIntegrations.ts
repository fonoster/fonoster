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
import * as path from "path";
import { getIntegrationsFromFile } from "@fonoster/common";
import { credentialRefFor, providerOfProductRef } from "./catalogMapping";
import { keyFromCredentials } from "./migrateCredentials";
import { newStepReport, StepOptions, StepReport } from "./types";

// add-provider-registry 5.3: integrations.json (platform vendor keys by product) becomes operator
// config keyed by credentialRef. Each key is written to its own file in a secrets directory (mode
// 0600) and referenced as `secret://file/<path>` (D8), or, without a directory, as an environment
// variable the operator sets. The output is one config fragment for the hosted Autopilot
// (`credentials`), the gateway (`providers.<id>.credential`) and the apiserver
// (`registry.platformCredentials`, `evaluations.credentials`). Nothing secret is printed.

export type IntegrationsMigrationOptions = StepOptions & {
  /** The legacy integrations file (JSON or YAML). */
  file: string;
  /** Where to write the config fragment (JSON, which every config loader accepts as YAML). */
  out: string;
  /** Where to write one file per key; without it, keys are referenced by environment variable. */
  secretsDir?: string;
};

export type CredentialsFragment = {
  credentials: Record<string, { value: string } | { env: string }>;
  providers: Record<
    string,
    {
      adapter: string;
      capabilities: string[];
      credential: { value: string } | { env: string };
    }
  >;
  registry: { platformCredentials: string[] };
};

export const envNameFor = (credentialRef: string) =>
  credentialRef.toUpperCase().replace(/[^A-Z0-9]/g, "_");

export function migrateIntegrations(
  options: IntegrationsMigrationOptions
): StepReport & { fragment: CredentialsFragment } {
  const report = newStepReport("integrations");
  const integrations = getIntegrationsFromFile(options.file);
  const keys = new Map<string, string>();
  const capabilities = new Map<string, Set<string>>();
  const fragment: CredentialsFragment = {
    credentials: {},
    providers: {},
    registry: { platformCredentials: [] }
  };

  for (const i of integrations) {
    const providerId = providerOfProductRef(i.productRef);
    if (!providerId) {
      report.skipped.push(i.productRef);
      report.notices.push({
        ref: i.productRef,
        level: "info",
        message: `${i.name} (${i.productRef}) has no adapter in this release; dropped`
      });
      continue;
    }
    const ref = credentialRefFor(providerId);
    const key = keyFromCredentials(JSON.stringify(i.credentials));
    const set = capabilities.get(providerId) ?? new Set();
    set.add(i.type);
    capabilities.set(providerId, set);
    const known = keys.get(ref);
    if (known !== undefined) {
      if (known !== key)
        report.notices.push({
          ref,
          level: "action",
          message: `${i.name} has a different key than another ${providerId} integration; ${ref} keeps the first`
        });
      continue;
    }
    keys.set(ref, key);
  }

  if (options.secretsDir && !options.dryRun)
    fs.mkdirSync(options.secretsDir, { recursive: true, mode: 0o700 });
  for (const [ref, key] of [...keys].sort()) {
    let source: { value: string } | { env: string };
    if (options.secretsDir) {
      const file = path.resolve(options.secretsDir, ref);
      if (!options.dryRun) fs.writeFileSync(file, key, { mode: 0o600 });
      source = { value: `secret://file${file}` };
    } else {
      source = { env: envNameFor(ref) };
      report.notices.push({
        ref,
        level: "action",
        message: `set ${envNameFor(ref)} to the ${ref} key (from ${options.file}) wherever the fragment is used`
      });
    }
    const providerId = ref.replace(/-default$/, "");
    fragment.credentials[ref] = source;
    fragment.providers[providerId] = {
      adapter: providerId,
      capabilities: [...(capabilities.get(providerId) ?? [])].sort(),
      credential: source
    };
    fragment.registry.platformCredentials.push(ref);
    report.changed.push(ref);
  }
  if (!options.dryRun)
    fs.writeFileSync(options.out, JSON.stringify(fragment, null, 2) + "\n", {
      mode: 0o600
    });
  return { ...report, fragment };
}
