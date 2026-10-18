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
// Exports each service's config schema to JSON Schema (add-self-host-installer 4.1, D5): the
// bundle ships them as config/schemas/<svc>.json for `fonoster-config check`. The service schemas
// live in the service packages, which depend on common, so this script (not common's library)
// imports them. The bundle build calls:
//
//   npx tsx mods/common/scripts/export-config-schemas.ts <outDir>
//
// or `exportConfigSchemas(outDir)` from this module.
import * as fs from "fs";
import * as path from "path";
import { ZodTypeAny } from "zod";
import { toJsonSchema } from "../src/config/toJsonSchema";

/** The services and the file each schema validates, by the name of the JSON file written. */
const SERVICES: Record<
  string,
  { file: string; schema: () => Promise<ZodTypeAny> }
> = {
  apiserver: {
    file: "fonoster.yaml",
    schema: async () =>
      (await import("../../apiserver/src/config/schema")).fonosterConfigSchema
  },
  identity: {
    file: "identity.yaml",
    schema: async () =>
      (await import("../../identity/src/server/config"))
        .identityServiceConfigSchema
  },
  gateway: {
    file: "gateway.yaml",
    schema: async () =>
      (await import("../../appbridge/src/configSchema")).gatewayConfigSchema
  },
  autopilot: {
    file: "autopilot.yaml",
    schema: async () =>
      (await import("../../autopilot/src/session/hosted")).hostedConfigSchema
  }
};

/** Writes `<outDir>/<svc>.json` for every service; returns the paths written. */
export async function exportConfigSchemas(outDir: string): Promise<string[]> {
  fs.mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const [svc, { file, schema }] of Object.entries(SERVICES)) {
    const json = toJsonSchema(await schema(), {
      id: `https://fonoster.com/schemas/config/${svc}.json`,
      title: `Fonoster ${svc} configuration (${file})`
    });
    const out = path.join(outDir, `${svc}.json`);
    fs.writeFileSync(out, JSON.stringify(json, null, 2) + "\n");
    written.push(out);
  }
  return written;
}

// eslint-disable-next-line no-undef
if (require.main === module) {
  const outDir = process.argv[2];
  if (!outDir) {
    console.error("usage: export-config-schemas <outDir>");
    process.exit(2);
  }
  exportConfigSchemas(path.resolve(outDir))
    .then((files) => {
      for (const f of files)
        console.log(`wrote ${path.relative(process.cwd(), f)}`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
