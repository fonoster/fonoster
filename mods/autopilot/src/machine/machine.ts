/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { assign, setup } from "xstate";
import { guards } from "./guards";
import { types } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export const machine = setup({
  types,
  actions: {
    sendGreeting: async function ({ context }) {
      await context.voice.answer();
      context.voice.say("Hello, how can I help you?");
    },
    interruptAISpeaking: function () {
      logger.verbose("interruptAISpeaking");
    },
    processHumanRequest: function ({ event }) {
      const speech = (event as { speech: string }).speech;
      logger.verbose("processHumanRequest", speech);
    },
    resetIdleTimeoutCount: assign({ idleTimeoutCount: 0 }),
    incrementIdleTimeoutCount: assign({
      idleTimeoutCount: ({ context }) => context.idleTimeoutCount + 1
    }),
    hangup: async function ({ context }) {
      await context.voice.hangup();
    }
  },
  guards,
  delays: { IDLE_TIMEOUT: 15000 }
}).createMachine({
  context: ({ input }) => ({
    idleTimeoutCount: input.idleTimeoutCount,
    idleTimeoutLimit: input.idleTimeoutLimit,
    voice: input.voice
  }),
  id: "fnAI",
  initial: "welcome",
  states: {
    welcome: {
      always: {
        target: "active"
      },
      entry: {
        type: "sendGreeting"
      },
      description: "The initial state where the AI greets the Human."
    },
    active: {
      on: {
        HUMAN_PROMPT: {
          target: "active",
          actions: {
            type: "processHumanRequest"
          },
          description: "This must be triggered when speech to text ends."
        },
        VOICE_DETECTED: {
          target: "humanSpeaking",
          actions: {
            type: "resetIdleTimeoutCount"
          },
          description: "This must be triggered by a VAD or similar system."
        }
      },
      after: {
        IDLE_TIMEOUT: {
          target: "idle"
        }
      },
      description: "The state where the AI is actively engaged in conversation."
    },
    humanSpeaking: {
      always: {
        target: "active"
      },
      entry: {
        type: "interruptAISpeaking"
      },
      description:
        "The state where the AI detects Human speech while it is speaking."
    },
    idle: {
      on: {
        VOICE_DETECTED: {
          target: "humanSpeaking",
          actions: {
            type: "resetIdleTimeoutCount"
          },
          description: "This must be triggered by a VAD or similar system."
        }
      },
      after: {
        IDLE_TIMEOUT: [
          {
            target: "reIdle",
            actions: {
              type: "incrementIdleTimeoutCount"
            },
            guard: {
              type: "idleTimeoutNotReached"
            }
          },
          {
            target: "hangup",
            guard: {
              type: "idleTimeoutReached"
            }
          }
        ]
      },
      description: "The state where the AI waits for Human input."
    },
    reIdle: {
      always: {
        target: "idle"
      },
      description:
        "The state where the AI resets the idle timeout (feels like a hack but it works.)"
    },
    hangup: {
      type: "final",
      description:
        "The final state where the AI terminates the conversation due to inactivity.",
      entry: {
        type: "hangup"
      }
    }
  }
});
