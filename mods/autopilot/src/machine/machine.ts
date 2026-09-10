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
import { and } from "xstate";
import { assign } from "xstate";
import { context } from "./context";
import { machineSetup } from "./setup";

const machine = machineSetup.createMachine({
  context,
  id: "fnAI",
  initial: "greeting",
  states: {
    greeting: {
      // The greeting is invoked (not fired-and-forgotten) so the machine only
      // moves to "idle", and therefore only arms the idle clock, once the
      // first message has been fully played.
      invoke: {
        src: "doGreetUser",
        description: "Answer the call and play the first message",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "idle",
          description: "Transition to idle after the initial greeting."
        },
        onError: {
          target: "idle"
        }
      },
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "The user barged in during the greeting."
        }
      }
    },

    idle: {
      entry: [{ type: "cleanSpeech" }],
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "Event from VAD system."
        }
      },
      after: {
        IDLE_TIMEOUT: [
          {
            target: "hangup",
            actions: { type: "goodbye" },
            guard: and(["idleTimeoutCountExceedsMax"])
          },
          {
            target: "announcingIdleTimeout"
          }
        ]
      }
    },

    announcingIdleTimeout: {
      // A dedicated state, with no IDLE_TIMEOUT of its own, so the idle clock
      // is stopped while the idle message plays. It is re-armed only when the
      // message finishes and the machine goes back to "idle". This prevents
      // back-to-back idle announcements (and a premature hangup) when the
      // idle timeout is short relative to the message duration.
      entry: [{ type: "increaseIdleTimeoutCount" }],
      invoke: {
        src: "doAnnounceIdleTimeout",
        description: "Play the idle message",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "idle",
          description: "Re-arm the idle clock once the idle message finishes."
        },
        onError: {
          target: "idle"
        }
      },
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "The user spoke while the idle message was playing."
        }
      }
    },

    listeningToUser: {
      entry: [
        { type: "interruptPlayback" },
        { type: "resetIdleTimeoutCount" },
        assign({ hasLateSpeech: false })
      ],
      on: {
        SPEECH_RESULT: {
          target: "waitingForSpeechTimeout",
          actions: {
            type: "appendSpeech"
          },
          description: "Append final speech and process the request.",
          reenter: true
        }
      },
      after: {
        IDLE_TIMEOUT: [
          {
            target: "hangup",
            actions: { type: "goodbye" },
            guard: and(["idleTimeoutCountExceedsMax"])
          },
          {
            target: "announcingIdleTimeout"
          }
        ]
      }
    },

    waitingForSpeechTimeout: {
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "User started speaking again.",
          guard: ({ context }) => context.allowUserBargeIn
        },
        SPEECH_RESULT: {
          target: "waitingForSpeechTimeout",
          description: "Capture late speech, but only once.",
          guard: ({ context }) => !context.hasLateSpeech,
          actions: [{ type: "appendSpeech" }, assign({ hasLateSpeech: true })]
        }
      },
      after: {
        MAX_SPEECH_WAIT_TIMEOUT: {
          target: "processingUserRequest",
          description:
            "This will give the person time to breathe and speak again.",
          reenter: true
        }
      }
    },

    hangup: {
      type: "final"
    },

    processingUserRequest: {
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "Event from VAD or similar system.",
          guard: ({ context }) => context.allowUserBargeIn,
          // We assume that the user wants to steer the conversation
          // back to the agent so we clean the speech buffer
          actions: [{ type: "cleanSpeech" }]
        },
        SPEECH_RESULT: {
          target: "processingUserRequest",
          description:
            "Capture only a single late speech across the entire request processing.",
          guard: ({ context }) =>
            context.allowUserBargeIn && !context.hasLateSpeech,
          actions: [
            { type: "interruptPlayback" },
            { type: "appendSpeech" },
            assign(({ self }) => {
              return {
                previousState: self.getSnapshot().value,
                hasLateSpeech: true
              };
            })
          ],
          reenter: true
        }
      },
      invoke: {
        src: "doProcessUserRequest",
        description: "Process the user request",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "listeningToUser",
          reenter: true,
          actions: [
            { type: "cleanSpeech" },
            assign({
              isFirstTurn: false
            })
          ]
        }
      }
    }
  },
  after: {
    MAX_SESSION_DURATION: {
      target: ".hangup",
      actions: { type: "goodbye" }
    }
  }
});

export { machine };
