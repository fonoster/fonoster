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
  /** @xstate-layout N4IgpgJg5mDOIC5QDMB2BBAkgYgFQG0AGAXUVAAcB7WASwBcbLUyQAPRAWgFYBmARgB0ADi58A7CMIA2HgBYuATj4AaEAE9EPAEwDZYsQqljZQnoT18pUgL7XVaLNlaw6AQzpgBr5B4BOACgBZdAANAH0AZQBRCIjMAHkAOTCAEQBVACV0ABUExIBKbAdMIlIkECpaBiYWdgQOHiExAWktRVNRY1kVdUQ22QEtBWMxKUNLSy4uW3sMTAEoXzAwBlQobFKWSvpGZnK6viFBHgMjbSFpKSOpVQ0EBR4uAWGrNqUtLUexGZBigRoIAAbMDYCIABSiUQAwgAJSLZdAZbKbcrbap7UB1BSEZoiT5iLRCPQ8IxiW6ICQ6bEyfSEQ4GWRaH5-AHApwudyebx+fyYFIAGSiYVygSi8TS2UKLKBYBRFGoOxq+0QXFkhGeXCOCiECmxhBJXHJCD4-EEfCGfEUWjV5l4zLm-xl7LcHi8PjAAT5guFmFF4slRQdrNlfDK8qqu1qmhMAnEolERhMhK0Rr45p4AmMFy4xlEJPk9qwAkBNBcYFQNDW2UoaVgHtBEOhcIyMTS-ORJC2CvRUYQUhjQhkClkQ8Mw1kRpJ6t1YlVQ0I5j4ap4hfmJbLFarNbrvmdnLdPK9QpFYolUod648m6g1drHrlFW7keVxrTQkzYkeQmt2Las9ThDfpmfCEIo+p5gSK52L8DoAO6uDsawAGKUL4ETkMsADGAAW2Q0AAtmAlAAK50A2kKwvCiIdmGj4RkqmKIOI6pmN0Ei6p8WinEaihPE0jKEMm+iyKuAjwYhUAoWhGFgDheGESRZHghRzatu2D5os+jH1PIzyNHoozSGqaaGr0CD4i0ejyESDw5nGoniaskmoehWG4QRRGkXurrch6QShJEjaUQA6lg2Q+n6Z6BkWjmVs50lufJnl0BpT4MWwTGHO+kFiJYDxGN+KZmdaVJCDqIhWFwYxHEIonkL4lCYXAtBrHevgZGAACOxFwGREBMJ4lYAG6UAA1p4fz1Y1zVxW1HXdb1CDDY17i7KUqX0RiGXGm0OgklqZiKI0PR3GBuiCU0n4nGxInQZNDVNbALVQHNXU9S45FNlRSIbYqW0HDwJKxoDg78DmrEKEa7ECAmsgjnSdJjLdsxFlNj3Pa9C0fcpX0thEbY0V2m29uIRIftIOpqv2gGTrICixpBJwnNqgHDrY0GoJQEBwCwxRE39vYcLIjwtFIbwdOIcMnUxdMw1ZVxDDqXD6qJizLE5-M9i+HBGIMYwEvqChaIBVhCEaRtSLo+hG+Y+qzo8onBprWnbTmOhSGmYvjHDYj6ubWiWwZNvLvb0x3RepZXnFt47s76V1E06oHaB-AyFME5mVVghlQuphjI0moOQhTlSa5snuQppFx-9TG6x7g6ElIgn9v2k66pm1rmvnuXSLOonYa4azEeQ1eC8bTxi-wSiCSMRV3Ca-ACI8bsmFVVVs+HqMPTNrU7vN710KPL6WrwS8e6TUjK58PA8U0wgXIBwuXzwRvfOzQA */
  context,
  id: "fnAI",
  initial: "greeting",
  states: {
    greeting: {
      always: {
        target: "idle",
        description: "Transition to idle after the initial greeting."
      },
      entry: {
        type: "greetUser"
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
            target: "idle",
            actions: [
              { type: "increaseIdleTimeoutCount" },
              { type: "announceIdleTimeout" }
            ],
            reenter: true
          }
        ]
      }
    },

    listeningToUser: {
      entry: [{ type: "interruptPlayback" }, { type: "resetIdleTimeoutCount" }],
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
            target: "idle",
            actions: [
              { type: "increaseIdleTimeoutCount" },
              { type: "announceIdleTimeout" }
            ]
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
          description: "Append speech and go back to listening.",
          actions: [{ type: "appendSpeech" }]
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
          // This makes sure result that
          target: "processingUserRequest",
          description: "Append speech and go back to listening.",
          actions: [{ type: "interruptPlayback" }, { type: "appendSpeech" }],
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
          actions: [{ type: "cleanSpeech" }]
        }
      }
    }
  },
  after: {
    MAX_SESSION_DURATION: {
      target: ".hangup",
      actions: { type: "goodbye" }
    }
  },
  on: {
    "*": {
      actions: assign(({ context, self }) => {
        const isReentry = self.getSnapshot().value === context.previousState;
        return {
          previousState: self.getSnapshot().value,
          isReentry
        };
      })
    }
  }
});

export { machine };
