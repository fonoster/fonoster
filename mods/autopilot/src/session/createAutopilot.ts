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
import { Agent, Recorder, sessionRecorder } from "./Agent";
import { SessionAssistant, sessionAssistantSchema } from "./config";
import { autopilotMachine } from "./machine";
import { resolveThink, Think, ThinkProvider } from "./think";
import { HttpToolPort, ToolPort } from "./tools";
import type { Session } from "@fonoster/voice/session";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export type AutopilotOptions = {
  /** The assistant for a session (validated with the session assistant schema). */
  assistant: unknown | ((session: Session) => Promise<unknown> | unknown);
  /** Language model endpoints by provider name (stand-in for the provider registry). */
  providers?: Record<string, ThinkProvider>;
  think?: Think;
  tools?: ToolPort;
  recorder?: Recorder;
  /** Called with each session's Agent, for tests and observability. */
  onAgent?: (agent: Agent) => void;
};

/**
 * Autopilot as an ordinary session app (rework-autopilot A2): returns a VoiceServer handler that
 * runs the state machine on the session's public messages only.
 */
export function createAutopilotHandler(options: AutopilotOptions) {
  return async (session: Session): Promise<void> => {
    const raw =
      typeof options.assistant === "function"
        ? await options.assistant(session)
        : options.assistant;
    const assistant: SessionAssistant = sessionAssistantSchema.parse(raw);
    const think =
      options.think ??
      resolveThink(assistant.languageModel.model, options.providers ?? {}, {
        temperature: assistant.languageModel.temperature,
        maxTokens: assistant.languageModel.maxTokens
      });
    const agent = new Agent(
      session,
      assistant,
      think,
      options.tools ?? new HttpToolPort(assistant.languageModel.tools),
      options.recorder ?? sessionRecorder(session)
    );
    options.onAgent?.(agent);

    const actor = createActor(autopilotMachine, { input: { agent } });
    agent.send = (event) => actor.send(event);

    session.on("turn.user_started", () =>
      actor.send({ type: "TURN_USER_STARTED" })
    );
    session.on("turn.likely_ended", (e) =>
      actor.send({ type: "TURN_LIKELY_ENDED", text: e.text })
    );
    session.on("turn.resumed", () => actor.send({ type: "TURN_RESUMED" }));
    session.on("turn.ended", (e) =>
      actor.send({ type: "TURN_ENDED", text: e.text })
    );
    session.on("turn.backchannel", () =>
      actor.send({ type: "TURN_BACKCHANNEL" })
    );

    const ended = new Promise<void>((resolve) =>
      session.on("end", () => {
        actor.send({ type: "SESSION_END" });
        resolve();
      })
    );
    actor.subscribe((state) =>
      logger.verbose("autopilot state", {
        callRef: session.callRef,
        state: state.value
      })
    );
    actor.start();
    await ended;
    actor.stop();
  };
}
