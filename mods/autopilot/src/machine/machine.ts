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
  /** @xstate-layout N4IgpgJg5mDOIC5QDMB2BBAkgYgB6wBcBDAsAOiOVICcAKAWXQA0B9AZQFE23MB5AORYARAKoAldABU+-AJTY0WANoAGALqJQABwD2sAJYF9O1JpC5EAWgDMADgDsZFQDYATAFYAnLevuAjPYALIF+ADQgAJ6IHoFkrp5B9s6ezn6pzu7uAL5Z4YqYZFDUYGBGqFDYqhpIILoGRiZmFgh+tn5k1vYp9tauti7Obc7hUQievmQJzm5efq6uvvY5eRgF+hAANmDYbAAKHBwAwgAS7JLoYpJVZnWGxqY1zZ4qjrbuC-Z9gT3O9vYjiHstlckxcnXsKlaXUCrmWIHyZHWWzwhBI5EoNFomCEABkOCxpPQOLwRJJ5AikWBrjVbg0HqBmu5AipJu42t5PM8VNYMgCWtY-O05p4-F5XMyVIF3NY4RTNtt8MRSBQqGA6Ni8QTMESSWSFKtEfKlH5qto9HdGo9ENZArYyAF-P5fra+q4+YKFmQgv13EF-DypbKDRt9IQwKh9OVJDoRLA1Tt9kdTmIuCIcVd1DdzXSmohnLayLZnNZPIFi5zkkE+TyWZz7Ez4ipJX5mTLcvDg6HSBGozG49QUUr0ar1bj8YTiaTyZ2wz2oNHY2rqWb6vdcy1BXa-r5gYFnh56+6VMCvX4VF5uf7Pm2VlgyAB3Ih3coAMR01DYWhKAGMABaSfQAFswB0ABXAgEwOE4zguDNTVqbM1ytFoIQ6ZsgU5BZXC6YZIkQLx3ELIJXBUV0-kCIM70fZ8oDfD8vzAP8AOAsCIL2KDk1TdNlwQ1dLQZKwpUmOxviSFxmUFdw+Q+JxvilWw90WB1KIKaiylo99Px-f8gJA8DBzRFVMUYVh2KTFgAHUsEkLUdSnfUqKfdS6K0xidJY8CeNpJCBI3Wwtw+NJxl+YE3TwhBxRBbxbG8dxpji7xWhUsgtGoHRvzgAxykXagxDAABHUC4AgiATHISMADcdAAa3IBFUvSzLIygHK8sK4qEEq9KSHuKovMQ-jzEQOZ3g6QY-HGc9xjaPkLzIZk+m3ToQiCZKGoy2Aspa-s2qKwhIPMthzkufq+PpIb+R5e1rDsYtRR6SVPD5DCyCdYJnEhSFkgo9t6rSjattagq9rYxNoJTNg0zgrMzvXAIFK9CFBlLcTj2rPd7WvTpOm8Y9SxydtUB0CA4DMfIYYtc7mksQIJhcDxvF8AJgjCcKW08V65Liss5h6bxkqKEp1IpnNkMsX44krEiSxIotBj5TxXGcea-kVyVuXrXxkspEWfIu30QVSNJ4lSYIIWsBWlZVroSNbTXsl+mdu2ahd+11wbmgcFl2Wsc8BWLTJAlm1JC36Y8eWmtlkrU5qXIYpjdNY92qeGiXUiLPoPqVssg-CksOc+EIlfGewz1+B3bwKX8iHKUCtGT9dLBIwi3AFEVSMSMLRj8G72l8A3bTihKfsrlL-qa7KduB4qG+Q0VpTGwUgQyUibtmhxQ6bBSeWlRWlgJoA */
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
          description: "Capture any late speech.",
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
          target: "processingUserRequest",
          description: "Capture any late speech and go back to processing.",
          actions: [
            { type: "interruptPlayback" },
            { type: "appendSpeech" },
            assign(({ context, self }) => {
              const isReentry =
                self.getSnapshot().value === context.previousState;
              return {
                previousState: self.getSnapshot().value,
                isReentry
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
          actions: [{ type: "cleanSpeech" }, assign({ isFirstTurn: false })]
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
