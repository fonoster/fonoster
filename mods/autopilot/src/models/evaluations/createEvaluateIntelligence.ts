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
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  withErrorHandling
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { evalTestCases } from "./evalTestCases";
import { ScenarioEvaluationRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createEvaluateIntelligence() {
  const evaluateIntelligence = async (
    call: { request: ScenarioEvaluationRequest },
    callback: (error: GrpcErrorMessage, response?: any) => void
  ) => {
    const { request } = call;
    const { assistantConfig, scenario, languageModel } = request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to evaluateIntelligence", {
      accessKeyId,
      request
    });

    const result = await evalTestCases({
      intelligence: {
        config: assistantConfig
      }
    });

    console.log(result);

    // Return empty results array for now
    callback(null, { results: [] });
  };

  return withErrorHandling(evaluateIntelligence);
}

export { createEvaluateIntelligence };
