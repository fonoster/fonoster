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
  ExpectedTextType,
  ScenarioEvaluationReport,
  StepEvaluationReport
} from "@fonoster/types";
import { Agent, TurnTrace } from "../../../session/Agent";
import { SessionAssistant } from "../../../session/config";
import { createAutopilotHandler } from "../../../session/createAutopilot";
import { ChatMessage, Think, ToolCall } from "../../../session/think";
import { ToolOutcome, ToolPort } from "../../../session/tools";
import { evaluateTextResponse } from "../evaluateTextResponse";
import { evaluateToolCalls } from "../evaluateToolCalls";
import { EvalScenario } from "../types";
import { EvalOutput, EvalSession } from "./EvalSession";
import type { Session } from "@fonoster/voice";

/** A step report with what the session engine streamed (extra fields, ignored on the wire). */
export type SessionStepReport = StepEvaluationReport & {
  streaming: {
    /** The pieces of the reply as the engine sent them to `say` (sentences). */
    pieces: string[];
    firstTokenMs?: number;
    firstSpeakMs?: number;
  };
  /** Tool calls and results as stored in the history (structured tool messages). */
  toolMessages: ChatMessage[];
};

export type SessionScenarioReport = ScenarioEvaluationReport & {
  steps: SessionStepReport[];
};

export type SessionEvalOptions = {
  assistant: SessionAssistant;
  /** The language model the engine streams from (a registry adapter, or the fake LLM). */
  think: Think;
  testTextSimilarity: (text1: string, text2: string) => Promise<boolean>;
  /**
   * Runs the assistant's own tools. Defaults to `evalToolPort`: evals never call tool endpoints
   * (an eval must not book an appointment), every call succeeds with `{ status: "ok" }`.
   */
  tools?: ToolPort;
  /** Upper bound for one step (default 60 s). */
  stepTimeoutMs?: number;
};

/** The default eval tool port: records nothing, calls nothing, every tool succeeds. */
export const evalToolPort: ToolPort = {
  run: async (): Promise<ToolOutcome> => ({
    ok: true,
    result: { status: "ok" }
  })
};

const SETTLE_POLL_MS = 10;

/** Resolves once the session has had no new output and no say in flight for two polls. */
async function settle(session: EvalSession) {
  let seen = -1;
  let quiet = 0;
  while (quiet < 2) {
    await new Promise((r) => setTimeout(r, SETTLE_POLL_MS));
    if (!session.busy && session.outputs.length === seen) quiet++;
    else quiet = 0;
    seen = session.outputs.length;
  }
}

function parseArgs(call: ToolCall): Record<string, unknown> {
  try {
    return call.arguments ? JSON.parse(call.arguments) : {};
  } catch {
    return {};
  }
}

/**
 * Runs one test-case scenario through the session engine (rework-autopilot 1.4): the real state
 * machine and Agent on an in-memory session, replies streamed sentence by sentence, tool calls
 * read back from the structured tool messages in the history.
 */
export async function evaluateSessionScenario(
  options: SessionEvalOptions,
  scenario: EvalScenario,
  onStepResult?: (
    scenarioRef: string,
    report: StepEvaluationReport
  ) => void | Promise<void>
): Promise<SessionScenarioReport> {
  const { assistant, testTextSimilarity } = options;
  const stepTimeoutMs = options.stepTimeoutMs ?? 60_000;
  const session = new EvalSession(scenario.telephonyContext);

  let agent: Agent | undefined;
  let signal: (() => void) | undefined;
  let thinkError: Error | undefined;
  const traces: TurnTrace[] = [];

  // Think errors are swallowed by the engine (it apologises); keep them for the report.
  const think: Think = {
    stream: (messages, tools, abort) =>
      (async function* () {
        try {
          yield* options.think.stream(messages, tools, abort);
        } catch (e) {
          if (!abort.aborted) {
            thinkError = e as Error;
            signal?.();
          }
          throw e;
        }
      })()
  };

  const handler = createAutopilotHandler({
    assistant: { ...assistant, testCases: undefined },
    think,
    tools: options.tools ?? evalToolPort,
    recorder: {
      turn: (t) => {
        traces.push(t);
        signal?.();
      },
      note: () => undefined
    },
    onAgent: (a) => (agent = a)
  });
  session.onOutput((o: EvalOutput) => {
    if (o.kind === "hangup" || o.kind === "transfer") signal?.();
  });
  const running = handler(session as unknown as Session);

  const results: SessionStepReport[] = [];
  try {
    await settle(session); // greeting
    for (const step of scenario.conversation) {
      const type = step.expected.text.type as unknown as ExpectedTextType;
      const report: SessionStepReport = {
        humanInput: step.userInput,
        expectedResponse: step.expected.text.response,
        aiResponse: "",
        evaluationType: type,
        passed: true,
        streaming: { pieces: [] },
        toolMessages: []
      };
      results.push(report);

      if (session.ended) {
        report.passed = false;
        report.errorMessage = `The call had already ended before "${step.userInput}".`;
        if (onStepResult) await onStepResult(scenario.ref, report);
        continue;
      }

      const outputsFrom = session.outputs.length;
      const historyFrom = agent?.history.length ?? 0;
      const tracesFrom = traces.length;
      thinkError = undefined;

      let timer: ReturnType<typeof setTimeout> | undefined;
      const done = new Promise<boolean>((resolve) => {
        signal = () => resolve(true);
        timer = setTimeout(() => resolve(false), stepTimeoutMs);
      });
      session.turn(step.userInput);
      const finished = await done;
      clearTimeout(timer);
      signal = undefined;
      await settle(session);

      const outputs = session.outputs.slice(outputsFrom);
      const says = outputs.filter(
        (o): o is Extract<EvalOutput, { kind: "say" }> => o.kind === "say"
      );
      const reply = says.filter((s) => s.streamed);
      const history = agent?.history.slice(historyFrom) ?? [];
      const toolCalls = history.flatMap((m) =>
        m.role === "assistant" ? (m.tool_calls ?? []) : []
      );
      const builtIn = toolCalls.find(
        (c) => c.name === "hangup" || c.name === "transfer"
      );
      const trace = traces[tracesFrom];

      report.streaming = {
        pieces: reply.flatMap((s) => s.pieces),
        firstTokenMs: trace?.firstTokenMs,
        firstSpeakMs: trace?.firstSpeakMs
      };
      report.toolMessages = history.filter(
        (m) => m.role === "tool" || (m.role === "assistant" && m.tool_calls)
      );
      // What the caller hears: the streamed reply; for hangup or transfer, the message the
      // engine says for it (as the legacy evals compared).
      report.aiResponse = builtIn
        ? builtIn.name === "hangup"
          ? assistant.conversationSettings.goodbyeMessage
          : (assistant.conversationSettings.transferOptions?.message ?? "")
        : reply
            .map((s) => s.text)
            .join("")
            .trim();

      if (thinkError) {
        report.passed = false;
        report.aiResponse = says.map((s) => s.text).join(" ");
        report.errorMessage = `Language model error for input "${step.userInput}": ${thinkError.message}`;
      } else if (!finished) {
        report.passed = false;
        report.errorMessage = `No reply within ${stepTimeoutMs} ms for "${step.userInput}".`;
      } else {
        const text = await evaluateTextResponse(
          { type, response: step.expected.text.response },
          report.aiResponse,
          testTextSimilarity
        );
        if (!text.passed) {
          report.passed = false;
          report.errorMessage = text.errorMessage;
        }
        if (step.expected.tools && step.expected.tools.length > 0) {
          const tools = evaluateToolCalls(
            step.expected.tools,
            toolCalls.map((c) => ({ name: c.name, args: parseArgs(c) }))
          );
          report.toolEvaluations = tools.evaluations;
          if (!tools.passed) {
            report.passed = false;
            report.errorMessage = report.errorMessage
              ? `${report.errorMessage} ${tools.errorMessage}`
              : tools.errorMessage;
          }
        }
      }
      if (onStepResult) await onStepResult(scenario.ref, report);
    }
  } finally {
    session.end();
    await running.catch(() => undefined);
  }

  return {
    scenarioRef: scenario.ref,
    overallPassed: results.every((s) => s.passed),
    steps: results
  };
}
