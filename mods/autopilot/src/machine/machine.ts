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
  /** @xstate-layout N4IgpgJg5mDOIC5QDMB2BBAkgYgB6wBcBDAsAOiOVICcAKAWXQA0B9AZQFE23MB5AORYARAKoAldABU+-AJTY0WANoAGALqJQABwD2sAJYF9O1JpC5EAWgDMAJgCcZAGwOAjAA4V9pyusB2e3cAGhAAT0RbAFYAFjIHJwDrJ2jXWxU06IBfTJDFTDIoajAwI1QobFUNJBBdAyMTMwsED1cyf28-O08nJ3dXJxDwhHtrSLJ7Px6o+1TbUb9s3Ix8-QgAGzBsNgAFDg4AYQAJdkl0MUlKs1rDY1NqpvsVPzJ3SLm-W3dozoS-QcQ-O5bOMVE5-H4VB4AtFbIsQHkyKsNnhCCRyJQaLRMEIADIcFjSegcXgiSTyBFIsCXarXep3UBNGIqcaRPqBeyPXxOSL-ZrWVytVIzSL2WzRFQqaKRaxwinrTb4YikChUMB0bF4gmYIkkskKZaI+VKVxVbR6G4Ne6IayOXoTQEpdIqSJg3kC9y2qW2b3eIHRKWyg0EahEVB1W76MqSHSYeUVdRXc10xrWr7jMG2blfdzWaLWSVu1xeMgQwGigUBAKBrBkNb6QhgVCRqDRkSwNVbXYHY5iLgiHEXBM0pO3FMIZLuF5g+zRafeCbRXlJZkcvwxBwSlLimU5eEGusNptRnRtjuKtEqzEa-GE4mk8n7+ukI8tk-t6jUs3hy0MxACjwlp0rJio8URrm6KhAiWRYir4kSuP4czVvkADuRA3GUABiOjUGwWjFAAxgAFpI+gALZgDoACuBCdnsRwnGcg6mjUI4-uYf4Qm0kquGWop2AEAxhIgIpjO4fgwukQJ+BJyFkGhGFQNhuH4WAxGkRR1G0Ts9E9n2A6fqx370hxCCWFK4zWF8Mk+MkkKuDywkIO8ZCShJrLRCMkR+LxkRyQppRKTheGESR5GUTRKJKuiqp0IwrA6d2LAAOpYJIWo6ve+o1gFzbKSFalhZpNGGbSo5Wgg0Rpkk-pgp4ML+ryUStG81hJPytgeK8gJyVo1A6ARcAGGUp7UGIYAAI5UXAtEQCY5CRgAbjoADW5AIn1A1Dc2o3jVNM0IEtA0kLclSlWxJlNKkoJtJ8LrSkWXi2LyIqtDJ9jAaCtgyf4vX9YNsDDVAu2TdNhB0UlbCnOc53GWOCFJGQCPuGCDmdJK9i8mWZDwcks6QpCTgzn9W2Azt757WD2ldgxvZsP2zGJnDFW8WmMmgh64p2cETm5o4vFzP47SeJz2S7qgOgQHAZh5EzFqXVY4LOG4njeL4AQ80MrieSWYrwR94rXVku4IoUxSBXLyYVZYCRxETHy+KKkE9JriCik4ZDfAEGTq9KfkmwalKW+Vv4IN5wJOAKLjeNr3y+Ly7ue+9Pv+H7cnBqGxnNtGsYbMH7EPMyIo+OKUqzmKfSFpBcRPCjIrZvBsIBzWB7Ptnb5qvnCsIOJzJsvmD1gpEMQvZHLyeJBSQjK87j+ehgX5ap6nhVpXfw7bkco58PiZrOi68xyuspJmIw+aCa5yURoZQFRWhr9baRjC4-IzOkEkfG6bWtKM4dVfdRPGyWDWTaAMgYg32oQe+ocHLSjaJHVm3J0htReuJceEovhJGlKKBYYsgA */
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
          guard: ({ context }) => context.allowUserBargeIn
        },
        SPEECH_RESULT: {
          target: "processingUserRequest",
          description: "Append speech and go back to listening.",
          actions: [{ type: "interruptPlayback" }, { type: "appendSpeech" }]
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
  }
});

export { machine };
