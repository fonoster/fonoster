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
import {
  evalErrorToEventPayload,
  scenarioSummaryToEventPayload,
  stepReportToEventPayload
} from "./stepReportToEventPayload";
import { runEval } from "./runEval";
import { EvaluateIntelligenceRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type ServerStreamCall = {
  request: EvaluateIntelligenceRequest;
  write: (chunk: Record<string, unknown>) => void;
  end: () => void;
};

function createEvaluateIntelligence(integrations: IntegrationConfig[]) {
  const evaluateIntelligence = async (call: ServerStreamCall): Promise<void> => {
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

      let writeCount = 0;
      await runEval(
        { intelligence: { config: effectiveConfig } },
        {
          onStepResult: (scenarioRef, stepReport) => {
            const payload = stepReportToEventPayload(scenarioRef, stepReport);
            // #region agent log
            const sr = payload.stepResult as Record<string, unknown> | undefined;
            const report = sr?.report as Record<string, unknown> | undefined;
            const toolEvals = report?.toolEvaluations as unknown[] | undefined;
            fetch('http://127.0.0.1:7246/ingest/a5f4c8ad-0ea5-4182-b89a-285e4ec740dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'createEvaluateIntelligence.ts:onStepResult',message:'before call.write stepResult',data:{writeCount,payloadKeys:Object.keys(payload),hasStepResult:!!sr,reportKeys:report?Object.keys(report):[],toolEvalsCount:toolEvals?.length??0,firstToolHasExpectedParams:toolEvals?.[0]?(Object.keys((toolEvals[0] as Record<string,unknown>).expectedParameters||{}).length>0):false},hypothesisId:'H2_H3',timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            call.write(payload);
            writeCount++;
          },
          onScenarioComplete: (scenarioRef, overallPassed) => {
            const payload = scenarioSummaryToEventPayload(scenarioRef, overallPassed);
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/a5f4c8ad-0ea5-4182-b89a-285e4ec740dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'createEvaluateIntelligence.ts:onScenarioComplete',message:'before call.write scenarioSummary',data:{writeCount,payloadKeys:Object.keys(payload)},hypothesisId:'H2_H5',timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            call.write(payload);
            writeCount++;
          }
        }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      call.write(evalErrorToEventPayload(message));
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/a5f4c8ad-0ea5-4182-b89a-285e4ec740dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'createEvaluateIntelligence.ts:finally',message:'before call.end()',data:{},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      call.end();
    }
  };

  return evaluateIntelligence;
}

export { createEvaluateIntelligence };
