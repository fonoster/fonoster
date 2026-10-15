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
import { createEvaluateIntelligence } from "@fonoster/autopilot";
import { Prisma } from "../core/db";
import { INTEGRATIONS_FILE, SESSION_APPS } from "../envs";
import { getIntegrationsFromFile } from "../utils/getIntegrationsFromFile";
import { createCreateApplication } from "./createCreateApplication";
import { createCreateTestToken } from "./createCreateTestToken";
import { createDeleteApplication } from "./createDeleteApplication";
import { createGetApplication } from "./createGetApplication";
import { createListApplications } from "./createListApplications";
import { createRotateSigningSecret } from "./createRotateSigningSecret";
import { createUpdateApplication } from "./createUpdateApplication";
import { SessionAppsConfig } from "./session/appModel";
import { TestTokenConfiguration } from "./types";

function buildService(
  prisma: Prisma,
  testTokenConfig: TestTokenConfiguration,
  config: SessionAppsConfig = SESSION_APPS as SessionAppsConfig
) {
  // Read on first use: only the legacy assistant evaluation needs the integrations file.
  let evaluate: ReturnType<typeof createEvaluateIntelligence> | undefined;
  const evaluateIntelligence = (
    ...args: Parameters<ReturnType<typeof createEvaluateIntelligence>>
  ) => {
    evaluate ??= createEvaluateIntelligence(
      getIntegrationsFromFile(INTEGRATIONS_FILE)
    );
    return evaluate(...args);
  };

  return {
    definition: {
      serviceName: "Applications",
      pckg: "applications",
      version: "v1beta2",
      proto: "applications.proto"
    },
    handlers: {
      createApplication: createCreateApplication(prisma, config),
      getApplication: createGetApplication(prisma),
      listApplications: createListApplications(prisma),
      deleteApplication: createDeleteApplication(prisma),
      updateApplication: createUpdateApplication(prisma, config),
      rotateSigningSecret: createRotateSigningSecret(prisma, config),
      evaluateIntelligence,
      createTestToken: createCreateTestToken(testTokenConfig)
    }
  };
}

export { buildService };
