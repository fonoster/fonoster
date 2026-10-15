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
import { setup } from "xstate";
import { Agent, AgentEvent } from "./Agent";

/**
 * Autopilot's states (rework-autopilot A4). The machine decides; the Agent acts on the session.
 * The idle clock runs only in listening.
 */
export const autopilotMachine = setup({
  types: {
    context: {} as { agent: Agent },
    input: {} as { agent: Agent },
    events: {} as AgentEvent
  },
  guards: {
    spokenFrom: ({ event }, sources: string[]) =>
      event.type === "SPOKEN" && sources.includes(event.source),
    bargeIn: ({ context }) => context.agent.settings.allowUserBargeIn,
    idleExhausted: ({ context }) => context.agent.idleExhausted()
  },
  actions: {
    greet: ({ context }) => void context.agent.greet(),
    armIdle: ({ context }) => context.agent.armIdle(),
    disarmIdle: ({ context }) => context.agent.disarmIdle(),
    sayIdle: ({ context }) => void context.agent.sayIdle(),
    prepare: ({ context, event }) =>
      context.agent.prepare((event as { text: string }).text),
    resumed: ({ context }) => context.agent.resumed(),
    answer: ({ context, event }) =>
      void context.agent.answer((event as { text: string }).text),
    abortReply: ({ context }) => context.agent.abortReply(),
    clear: ({ context }) => void context.agent.clear(),
    goodbye: ({ context }) => void context.agent.goodbye(),
    transfer: ({ context }) => void context.agent.transfer(),
    stop: ({ context }) => context.agent.stop()
  }
}).createMachine({
  id: "autopilot",
  initial: "greeting",
  context: ({ input }) => ({ agent: input.agent }),
  on: {
    SESSION_END: ".ended",
    MAX_DURATION: ".ending",
    HANGUP_REQUESTED: ".ending",
    TRANSFER_REQUESTED: ".transferring",
    // Backchannels are not interruptions: nothing happens in any state.
    TURN_BACKCHANNEL: {}
  },
  states: {
    greeting: {
      entry: "greet",
      on: {
        SPOKEN: {
          guard: { type: "spokenFrom", params: ["greeting"] },
          target: "listening"
        },
        TURN_USER_STARTED: { guard: "bargeIn", actions: "clear" },
        TURN_LIKELY_ENDED: { actions: "prepare" },
        TURN_RESUMED: { actions: "resumed" },
        TURN_ENDED: "thinking"
      }
    },
    listening: {
      entry: "armIdle",
      exit: "disarmIdle",
      on: {
        TURN_LIKELY_ENDED: { actions: "prepare" },
        TURN_RESUMED: { actions: "resumed" },
        TURN_ENDED: "thinking",
        IDLE: [
          { guard: "idleExhausted", target: "ending" },
          { target: "speaking", actions: "sayIdle" }
        ]
      }
    },
    thinking: {
      entry: "answer",
      on: {
        REPLY_SPEAKING: "speaking",
        SPOKEN: {
          guard: { type: "spokenFrom", params: ["reply", "error"] },
          target: "listening"
        },
        TURN_USER_STARTED: { guard: "bargeIn", actions: "clear" },
        // A new turn cancels the reply in flight; its user text stays in the history.
        TURN_ENDED: { target: "thinking", reenter: true, actions: "abortReply" }
      }
    },
    speaking: {
      on: {
        SPOKEN: {
          guard: { type: "spokenFrom", params: ["reply", "idle", "error"] },
          target: "listening"
        },
        TURN_USER_STARTED: { guard: "bargeIn", actions: "clear" },
        TURN_ENDED: { target: "thinking", actions: "abortReply" }
      }
    },
    transferring: {
      entry: "transfer",
      on: {
        SPOKEN: {
          guard: { type: "spokenFrom", params: ["error"] },
          target: "listening"
        }
      }
    },
    ending: { entry: "goodbye" },
    ended: { type: "final", entry: "stop" }
  }
});
