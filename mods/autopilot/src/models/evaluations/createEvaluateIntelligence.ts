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
  IntegrationConfig
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Struct, struct } from "pb-util";
import { z } from "zod";
import { createEvalEffectiveConfig } from "./createEvalEffectiveConfig";
import { runEval } from "./runEval";
import {
  evalErrorToEventPayload,
  scenarioSummaryToEventPayload,
  stepReportToEventPayload
} from "./stepReportToEventPayload";
import { EvaluateIntelligenceRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type ServerStreamCall = {
  request: EvaluateIntelligenceRequest;
  write: (chunk: Record<string, unknown>) => void;
  end: () => void;
};

function createEvaluateIntelligence(integrations: IntegrationConfig[]) {
  const evaluateIntelligence = async (
    call: ServerStreamCall
  ): Promise<void> => {
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

    try {
      const config = struct.decode(intelligence.config as unknown as Struct);

      const parsedIntelligence = z
        .object({
          productRef: z.string(),
          config: assistantSchema
        })
        .parse({
          productRef: intelligence.productRef,
          config
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

      await runEval(
        { intelligence: { config: effectiveConfig } },
        {
          onStepResult: (scenarioRef, stepReport) => {
            const payload = stepReportToEventPayload(scenarioRef, stepReport);
            call.write(payload);
          },
          onScenarioComplete: (scenarioRef, overallPassed) => {
            const payload = scenarioSummaryToEventPayload(
              scenarioRef,
              overallPassed
            );
            call.write(payload);
          }
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      call.write(evalErrorToEventPayload(message));
    } finally {
      call.end();
    }
  };

  return evaluateIntelligence;
}

export { createEvaluateIntelligence };
