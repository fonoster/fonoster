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
import fs from "fs";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { parseConfigFile } from "./parseConfigFile";

const integrationsConfigSchema = z.array(
  z.object({
    name: z.string(),
    productRef: z.string(),
    type: z.enum(["tts", "stt", "llm"]),
    credentials: z.record(z.unknown())
  })
);

/** Spelled out so callers get required fields regardless of tsconfig strictness. */
type IntegrationsConfig = Array<{
  name: string;
  productRef: string;
  type: "tts" | "stt" | "llm";
  credentials: Record<string, unknown>;
}>;

/**
 * Reads and validates the retired integrations file. Only `fonoster-migrate-legacy --integrations`
 * reads it now, to move its keys into operator config by credentialRef (add-provider-registry 5.3).
 * YAML (`.yaml`/`.yml`) or JSON with comments (`.json`/`.jsonc`). Throws with the
 * file path when the file can't be read or doesn't validate.
 */
function getIntegrationsFromFile(
  pathToIntegrations: string
): IntegrationsConfig {
  let raw: unknown;
  try {
    raw = parseConfigFile(
      pathToIntegrations,
      fs.readFileSync(pathToIntegrations, "utf8")
    );
  } catch (e) {
    throw new Error(
      `unable to read integrations at ${pathToIntegrations}: ${(e as Error).message}`
    );
  }

  const result = integrationsConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `invalid integrations at ${pathToIntegrations}: ${fromError(result.error, { prefix: null }).toString()}`
    );
  }

  return result.data as IntegrationsConfig;
}

export {
  integrationsConfigSchema,
  IntegrationsConfig,
  getIntegrationsFromFile
};
