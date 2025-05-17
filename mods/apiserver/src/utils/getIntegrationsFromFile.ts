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
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { fromError } from "zod-validation-error";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const integrationsConfigSchema = z.array(
  z.object({
    name: z.string(),
    productRef: z.string(),
    type: z.enum(["tts", "stt", "llm"]),
    credentials: z.record(z.unknown())
  })
);

function getIntegrationsFromFile(pathToIntegrations: string) {
  const integrationsFile = fs.readFileSync(pathToIntegrations, "utf8");
  const integrations = JSON.parse(integrationsFile);
  try {
    integrationsConfigSchema.parse(integrations);
  } catch (e) {
    // fatal error
    const message = fromError(e, { prefix: null }).toString();
    logger.error("integrations config is invalid", { message });
    process.exit(1);
  }
  return integrations;
}

export { getIntegrationsFromFile };
