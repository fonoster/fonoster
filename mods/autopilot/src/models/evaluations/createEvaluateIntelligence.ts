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
import { randomUUID } from "crypto";
import {
  getAccessKeyIdFromCall,
  sessionAgentSchema,
  Usage
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { StepEvaluationReport } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Struct, struct } from "pb-util";
import { meteredThink, UsageSink } from "../../session/meteredThink";
import { createEvalEffectiveConfig } from "./createEvalEffectiveConfig";
import { runEval } from "./runEval";
import { runSessionEval, sessionThinkFor } from "./session";
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

/**
 * A model provider's key for a workspace: the workspace's own vendor key, else the platform key
 * by the provider's credentialRef (the control plane decides; integrations.json is gone).
 */
export type EvalKeySource = (
  providerId: string,
  workspaceRef: string
) => Promise<EvalKey | string | undefined>;

/** A key and whose it is; a bare string is the platform's. */
export type EvalKey = { key: string; source: Usage.KeySource };

/**
 * Where an eval's usage goes (add-usage-metering D5): the workspace, the lines, and a scope that
 * is unique per request within the run, for the lines' ids.
 */
export type EvalUsageReporter = (
  workspaceRef: string,
  lines: Usage.UsageLine[],
  scope: string
) => void;

const keyOf = (k: EvalKey | string | undefined): EvalKey | undefined =>
  typeof k === "string" ? { key: k, source: "platform" } : k;

/**
 * Runs an agent's test cases (rework-autopilot 8.2: the agent is a session agent; its
 * catalog id picks the provider, and keys come from `keys`, never from the agent).
 */
function createEvaluateIntelligence(
  keys: EvalKeySource,
  reportUsage?: EvalUsageReporter
) {
  const evaluateIntelligence = async (
    call: ServerStreamCall
  ): Promise<void> => {
    const { request } = call;
    const { intelligence } = request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    try {
      const config = struct.decode(intelligence.config as unknown as Struct);
      const agent = sessionAgentSchema.parse(config);
      const provider = agent.languageModel.model.split("/")[0];
      logger.verbose("call to evaluateIntelligence", {
        accessKeyId,
        model: agent.languageModel.model
      });
      const agentKey = keyOf(await keys(provider, accessKeyId));
      const judgeKey = keyOf(await keys("openai", accessKeyId));
      const apiKey = agentKey?.key;
      const evaluationApiKey = judgeKey?.key;
      // Eval tokens are metered with origin eval, one scope per request of this run.
      const runId = randomUUID();
      let request = 0;
      const sink: UsageSink = {
        usage: (lines) =>
          reportUsage?.(accessKeyId, lines, `eval|${runId}|${request++}`),
        missing: (catalogId) =>
          logger.warn(`eval: ${catalogId} reported no usage`, { accessKeyId })
      };
      if (!apiKey && provider !== "ollama")
        throw new Error(`no ${provider} key for this workspace or platform`);
      if (!evaluationApiKey)
        throw new Error(
          "no openai key for the evaluation model (workspace or platform)"
        );

      const callbacks = {
        onStepResult: (
          scenarioRef: string,
          stepReport: StepEvaluationReport
        ) => {
          call.write(stepReportToEventPayload(scenarioRef, stepReport));
        },
        onScenarioComplete: (scenarioRef: string, overallPassed: boolean) => {
          call.write(scenarioSummaryToEventPayload(scenarioRef, overallPassed));
        }
      };

      // The session engine (streaming replies, structured tool messages) for OpenAI-compatible
      // providers; the LangChain path stays for the rest until their adapters land (EV-B1).
      const sessionThink = sessionThinkFor(agent, apiKey);
      if (sessionThink) {
        const think = meteredThink(
          sessionThink,
          {
            catalogId: agent.languageModel.model,
            keySource: agentKey?.source ?? "platform"
          },
          sink
        );
        await runSessionEval(
          {
            agent,
            think,
            evaluationApiKey,
            judgeUsage: { sink, keySource: judgeKey?.source ?? "platform" }
          },
          callbacks
        );
        return;
      }

      const effectiveConfig = createEvalEffectiveConfig(agent, {
        apiKey,
        evaluationApiKey
      });
      await runEval({ intelligence: { config: effectiveConfig } }, callbacks);
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
