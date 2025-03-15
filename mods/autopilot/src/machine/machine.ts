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
import { context } from "./context";
import { machineSetup } from "./setup";

const machine = machineSetup.createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDMB2BBAkgOigJzDABcBLVKAYgG0AGAXUVAAcB7WE0l1RkAD0QCMADgHYAzAHYAnADYJYgExCaMmSJkAaEAE9EUsQFZsUiaoUGpAhQsMSAvna1os2EhAA2YCgGUACgFF-AGEACQB9bwAVdAAlSNoGJBBWdk5uJP4EKRoJbCEDGwklABZ5OQktXQQJIQVjFUkJGmFpYoUHJwwcN08KXlgiAEMiMGxB5BG8AApMABEAGX8wyMwAWX8AeQBVSIBKCmdujzAEnhSOEi4eTINi4uwaYuyisVkBYubKwQUJUSEpKQGGiSAwCAyKIQdECHVzHPoDYajcaTGYLJYrdbbPYHLqwzxUASJZhsC5XDKIV7YNQmGrFAQ0BQ0AwyMRfBACYRSKnFArWWS1O4GKEwoh4QaoVKXVBkKCRFiYOGnJLnNLXClCe6yRQyAwaoRiYpiR5sjk0LlNGpSBQc6TSYW49wkAZgaXkOVbWBgPA+ALBcIxfzeLbzeL0M4k1XkhAyYpCPIsqTFBOyEzFNliGQ0YwmW4KbKPd7A+0uR3O12ylger3woYjMYTL2oxbLNabHb7GGlkbl92evBK4mSsmgTICV73cy3ZoCGTCSQKE00IRxmhM5p5pNvGTFnAAd0GF3IADEWHhvExCABjAAWkRIAFswCwAK5EH2BUIRaJxAfJCNStV2Qke55FTMQMykZQ8zZAwCmwAwmgUO4eXBQxIUcaFcX3Q8oBPM8LzAG870fF8336WskQbaZVnQAANCJfU-AB1LBIhbTF2xxFxsNIY9T3PK9bwfJ9X1-FUAKjWN7gzO4WWUNo7jZcxRAKcCWSsYR8hqHdsCYPAWEvOB2HIKs8BiMAAEdnzgN8IC4UYyAANxYABrUYYT0gyjJlUzzKsmyECcgzhilBIxP-Yc+EEekZAeSQjVqJRlwzNlZDqK0rUNQEZBMMEdM8wzYGMqBfMs6yBnfP0v1iUMiT-Id0hHaL-ji2QCjBK0bE0HREBqURshkawnjUCxtyhVAWAgOAeEOcMGsAgBaDkjAUHKimBK0l1UIQTRjB4bEMdS6RERMdPwQheKgObSUaqKEAWuRsFWkxGVeRkhG21LVuwUppEZD4QUMHSejAa7IyahAELqWcZzzWc7iaVkeqyb7fs2gGJHBIUMJFMUJRumU5QVTwwYkiHsng2RHkeW5BtjAQTXpONGRqHVINjUF2hxh0nW7QnKz7UnIsyIQmjyAR9CZMQZ0MW4YNnPJlCXCCxHydDOm4g9LrwgTCKEkjXyF27R0e2cPqUTNVqTNNkdec0kKsHLJBizGdOvcUoGfJgjcAj6-l1W5fmOukDBNPM6kdnIniebJDXy-TCuK0r-IGH2ozBcFxBh1mgQOmDRcV1cNQzcErXsBw7CAA */
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
      entry: [{ type: "cleanSpeech" }, { type: "setSpeakingDone" }],
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
            target: "transitioningToIdle",
            actions: [
              { type: "increaseIdleTimeoutCount" },
              { type: "announceIdleTimeout" }
            ]
          }
        ]
      }
    },

    transitioningToIdle: {
      // This intermediate state is necessary to ensure the IDLE_TIMEOUT
      // event is properly reset and retriggered when returning to idle.
      // Without it, the timer would not restart correctly.
      always: {
        target: "idle"
      }
    },

    listeningToUser: {
      entry: [
        { type: "interruptPlayback" },
        { type: "resetIdleTimeoutCount" },
        { type: "setSpeaking" }
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
            target: "transitioningToIdle",
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
          description: "User started speaking again."
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
          actions: [{ type: "cleanSpeech" }]
        }
      },
      invoke: {
        src: "doProcessUserRequest",
        description: "Process the user request",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "idle"
        }
      }
    }
  }
});

export { machine };
