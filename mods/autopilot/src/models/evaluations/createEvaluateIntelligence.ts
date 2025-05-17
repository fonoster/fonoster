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
import {
  assistantSchema,
  findIntegrationsCredentials,
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  IntegrationConfig,
  withErrorHandling
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ScenarioEvaluationReport } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Struct, struct } from "pb-util";
import { z } from "zod";
import { createEvalEffectiveConfig } from "./createEvalEffectiveConfig";
import { evalTestCases } from "./evalTestCases";
import { EvaluateIntelligenceRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createEvaluateIntelligence(integrations: IntegrationConfig[]) {
  const evaluateIntelligence = async (
    call: {
      request: EvaluateIntelligenceRequest;
    },
    callback: (
      error: GrpcErrorMessage,
      response?: { results: ScenarioEvaluationReport[] }
    ) => void
  ) => {
    const { request } = call;
    const { intelligence } = request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to evaluateIntelligence", {
      accessKeyId,
      llmProductRef: intelligence.productRef,
      evalLlmProductRef: "llm.openai"
    });

    const config = struct.decode(intelligence.config as unknown as Struct);

    const parsedIntelligence = z
      .object({
        productRef: z.string(),
        config: assistantSchema
      })
      .parse({
        productRef: intelligence.productRef,
        config: config
      });

    const credentials = findIntegrationsCredentials(
      integrations,
      intelligence.productRef
    ) as { apiKey: string };

    const evaluationApiKey = findIntegrationsCredentials(
      integrations,
      "llm.openai"
    ) as { apiKey: string };

    const effectiveConfig = createEvalEffectiveConfig(
      parsedIntelligence.config,
      credentials,
      evaluationApiKey
    );

    const results = await evalTestCases({
      intelligence: {
        config: effectiveConfig
      }
    });

    callback(null, { results });
  };

  return withErrorHandling(evaluateIntelligence);
}

export { createEvaluateIntelligence };
