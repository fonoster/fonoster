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
import { getLogger } from "@fonoster/logger";
import { createActor } from "xstate";
import { Agent, AgentEvent, Recorder, sessionRecorder } from "./Agent";
import { SessionAgent, sessionAgentSchema } from "./config";
import { KnowledgePort } from "./knowledge";
import { LlmResolver } from "./llm";
import { autopilotMachine } from "./machine";
import { telemetry } from "./telemetry";
import { resolveThink, Think, ThinkProvider } from "./think";
import { HttpToolPort, ToolPort } from "./tools";
import type { Session } from "@fonoster/voice";

const logger = getLogger({ service: "autopilot", filePath: __filename });

/** What the hosted Autopilot knows about the app a session belongs to. */
export type LoadedAgent = {
  agent: unknown;
  /** The workspace that owns the app: scope for its own keys (BYOK) and knowledge. */
  workspaceRef?: string;
};

export type AutopilotOptions = {
  /** The agent for a session (validated with the session agent schema). */
  agent?: unknown | ((session: Session) => Promise<unknown> | unknown);
  /**
   * The hosted path: loads the app's agent and workspace for a session; undefined means the
   * app has no agent (the call is ended).
   */
  load?: (session: Session) => Promise<LoadedAgent | undefined>;
  /** Language models through the provider registry (task 3.1). */
  llm?: LlmResolver;
  /** Language model endpoints by provider name (the stand-in used before the registry). */
  providers?: Record<string, ThinkProvider>;
  think?: Think;
  tools?: ToolPort;
  /**
   * Private destinations HTTP tools may call (host names, IPs, CIDRs); defaults to
   * FONOSTER_ALLOWED_DESTINATIONS. Everything else must be public (RV-B2).
   */
  allowedDestinations?: string[];
  /** Finds what is relevant to the caller's question (the knowledge port). */
  knowledge?: KnowledgePort;
  /** Builds the knowledge port for an agent (operator wiring, task 4.1). */
  knowledgeFor?: (
    agent: SessionAgent,
    scope: { workspaceRef?: string }
  ) => KnowledgePort | undefined;
  recorder?: Recorder;
  /** Called with each session's Agent, for tests and observability. */
  onAgent?: (agent: Agent) => void;
};

/**
 * Autopilot as an ordinary application (rework-autopilot A2): returns a VoiceServer handler that
 * runs the state machine on the session's public messages only.
 */
export function createAutopilotHandler(options: AutopilotOptions) {
  const run = createSessionRunner(options);
  return async (session: Session): Promise<void> => {
    // The session span joins the call's trace when AppBridge sent a traceparent.
    const span = telemetry.startCall(
      session.callRef,
      "autopilot.session",
      {
        "fonoster.app_ref": session.appRef,
        "fonoster.session_ref": session.sessionRef
      },
      session.traceparent
    );
    try {
      await run(session);
      span.end();
    } catch (e) {
      span.end({}, (e as Error).message);
      throw e;
    }
  };
}

function createSessionRunner(options: AutopilotOptions) {
  return async (session: Session): Promise<void> => {
    // Listen before any await: turn events that arrive while the agent and model load are
    // held and delivered once the machine runs.
    const early: AgentEvent[] = [];
    let deliver: (event: AgentEvent) => void = (event) => early.push(event);
    session.on("turn.user_started", () =>
      deliver({ type: "TURN_USER_STARTED" })
    );
    session.on("turn.likely_ended", (e) =>
      deliver({ type: "TURN_LIKELY_ENDED", text: e.text })
    );
    session.on("turn.resumed", () => deliver({ type: "TURN_RESUMED" }));
    // A turn with no words (line noise, an abandoned start) is not an answer: no reply, and the
    // idle count is kept, so a silent call still ends.
    session.on("turn.ended", (e) => {
      if (e.text.trim()) deliver({ type: "TURN_ENDED", text: e.text });
    });
    session.on("turn.backchannel", () => deliver({ type: "TURN_BACKCHANNEL" }));
    const ended = new Promise<void>((resolve) =>
      session.on("end", () => {
        deliver({ type: "SESSION_END" });
        resolve();
      })
    );

    const loaded: LoadedAgent | undefined = options.load
      ? await options.load(session)
      : {
          agent:
            typeof options.agent === "function"
              ? await options.agent(session)
              : options.agent
        };
    if (!loaded) {
      logger.warn("no agent for this app; ending the call", {
        appRef: session.appRef,
        callRef: session.callRef
      });
      await session.hangup().catch(() => undefined);
      return;
    }
    const agentConfig: SessionAgent = sessionAgentSchema.parse(loaded.agent);
    const scope = { workspaceRef: loaded.workspaceRef };
    const recorder = options.recorder ?? sessionRecorder(session);
    const settings = {
      temperature: agentConfig.languageModel.temperature,
      maxTokens: agentConfig.languageModel.maxTokens
    };
    let think = options.think;
    if (!think && options.llm) {
      try {
        const resolved = await options.llm.resolve(
          agentConfig.languageModel.model,
          settings,
          scope
        );
        think = resolved.think;
        if (resolved.event) recorder.note(resolved.event);
      } catch (e) {
        // A model the registry cannot serve: apologise and end the call, never a silent line.
        logger.error(
          `autopilot cannot reach its language model: ${(e as Error).message}`
        );
        recorder.note({
          type: "llm.unavailable",
          reason: (e as Error).message
        });
        await session
          .say(agentConfig.conversationSettings.systemErrorMessage, {
            interruptible: false
          })
          .catch(() => undefined);
        await session.hangup().catch(() => undefined);
        return;
      }
    }
    think ??= resolveThink(
      agentConfig.languageModel.model,
      options.providers ?? {},
      settings
    );
    const agent = new Agent(
      session,
      agentConfig,
      think,
      options.tools ??
        new HttpToolPort(agentConfig.languageModel.tools, {
          allow: options.allowedDestinations
        }),
      recorder,
      options.knowledge ?? options.knowledgeFor?.(agentConfig, scope)
    );
    options.onAgent?.(agent);

    const actor = createActor(autopilotMachine, { input: { agent } });
    agent.send = (event) => actor.send(event);

    actor.subscribe((state) =>
      logger.verbose("autopilot state", {
        callRef: session.callRef,
        state: state.value
      })
    );
    actor.start();
    deliver = (event) => actor.send(event);
    for (const event of early.splice(0)) actor.send(event);
    await ended;
    actor.stop();
  };
}
