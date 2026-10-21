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
import { EVALUATIONS, SESSION_APPS } from "../envs";
import { reportEvalUsage } from "../usage/publishUsage";
import { createCreateApplication } from "./createCreateApplication";
import { createCreateTestToken } from "./createCreateTestToken";
import { createDeleteApplication } from "./createDeleteApplication";
import { createGetApplication } from "./createGetApplication";
import { createListApplications } from "./createListApplications";
import { createRotateSigningSecret } from "./createRotateSigningSecret";
import { createUpdateApplication } from "./createUpdateApplication";
import { createEvalKeys } from "./evalKeys";
import { SessionAppsConfig } from "./session/appModel";
import { TestTokenConfiguration } from "./types";

function buildService(
  prisma: Prisma,
  testTokenConfig: TestTokenConfiguration,
  config: SessionAppsConfig = SESSION_APPS as SessionAppsConfig,
  findCallerEmail?: (userRef: string) => Promise<string | undefined>
) {
  const evaluateIntelligence = createEvaluateIntelligence(
    createEvalKeys(prisma, EVALUATIONS.credentials),
    reportEvalUsage
  );

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
      createTestToken: createCreateTestToken(testTokenConfig, findCallerEmail)
    }
  };
}

export { buildService };
