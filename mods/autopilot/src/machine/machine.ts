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
import { performance } from "perf_hooks";
import { getLogger } from "@fonoster/logger";
import { assign, fromPromise, setup } from "xstate";
import { AutopilotContext } from "./types";
import { ConversationSettings } from "../assistants";
import { LanguageModel } from "../models";
import { Voice } from "../voice";

const logger = getLogger({ service: "autopilot", filePath: __filename });

// eslint-disable-next-line mocha/no-top-level-hooks
const machine = setup({
  types: {
    context: {} as AutopilotContext,
    input: {} as {
      conversationSettings: ConversationSettings;
      languageModel: LanguageModel;
      voice: Voice;
    },
    events: {} as
      | { type: "SPEECH_START" }
      | { type: "SPEECH_END" }
      | { type: "SPEECH_RESULT"; speech: string }
      | { type: "USER_REQUEST_PROCESSED" }
  },
  actions: {
    greetUser: async ({ context }): Promise<void> => {
      logger.verbose("called greetUser action", {
        firstMessage: context.firstMessage
      });

      await context.voice.answer();

      await context.voice.say(context.firstMessage);
    },
    goodbye: async ({ context }) => {
      logger.verbose("called goodbye action", {
        goodbyeMessage: context.goodbyeMessage
      });

      await context.voice.say(context.goodbyeMessage);

      await context.voice.hangup();
    },
    announceSystemError: async ({ context }) => {
      logger.verbose("called announceSystemError action", {
        systemErrorMessage: context.systemErrorMessage
      });

      await context.voice.say(context.systemErrorMessage);
    },
    interruptPlayback: async ({ context }) => {
      logger.verbose("called interruptPlayback action", {
        sessionRef: context.sessionRef
      });

      await context.voice.stopSpeech();
    },
    announceIdleTimeout: async ({ context }) => {
      logger.verbose("called announceIdleTimeout action", {
        idleMessage: context.idleMessage
      });

      await context.voice.say(context.idleMessage);
    },
    increaseIdleTimeoutCount: assign(({ context }) => {
      logger.verbose("called increaseIdleTimeoutCount action", {
        idleTimeoutCount: context.idleTimeoutCount + 1
      });

      context.idleTimeoutCount++;
      return context;
    }),
    cleanSpeech: assign({ speechBuffer: "" }),
    appendSpeech: assign(({ context, event }) => {
      logger.verbose("called appendSpeech action", {
        speech: (event as { speech: string }).speech
      });

      const speech = (event as { speech: string }).speech;

      context.speechBuffer = (
        (context.speechBuffer || "") +
        " " +
        speech
      ).trimStart();

      return context;
    }),
    resetIdleTimeoutCount: assign(({ context }) => {
      logger.verbose("called resetIdleTimeoutCount action", {
        idleTimeoutCount: 0
      });

      context.idleTimeoutCount = 0;
      return context;
    }),
    setSpeaking: assign(({ context }) => {
      logger.verbose("called setSpeaking action", {
        isSpeaking: true
      });

      context.isSpeaking = true;
      return context;
    }),
    setSpeakingDone: assign(({ context }) => {
      logger.verbose("called setSpeakingDone action", {
        isSpeaking: false
      });

      context.isSpeaking = false;
      return context;
    })
  },
  guards: {
    idleTimeoutCountExceedsMax: function ({ context }) {
      logger.verbose("called idleTimeoutCountExceedsMax guard", {
        idleTimeoutCount: context.idleTimeoutCount,
        maxIdleTimeoutCount: context.maxIdleTimeoutCount
      });

      return context.idleTimeoutCount >= context.maxIdleTimeoutCount;
    },
    hasSpeechResult: function ({ context }) {
      return context.speechBuffer !== "";
    },
    isNotSpeaking: function ({ context }) {
      logger.verbose("called isNotSpeaking guard", {
        isSpeaking: context.isSpeaking
      });

      return !context.isSpeaking;
    }
  },
  delays: {
    IDLE_TIMEOUT: ({ context }) => {
      return context.idleTimeout;
    },
    MAX_SPEECH_WAIT_TIMEOUT: ({ context }) => {
      return context.maxSpeechWaitTimeout;
    }
  },
  actors: {
    doProcessUserRequest: fromPromise(
      async ({ input }: { input: { context: AutopilotContext } }) => {
        const { context } = input;
        logger.verbose("called processUserRequest action", {
          speechBuffer: context.speechBuffer
        });

        context.speechResponseStartTime = performance.now();

        // Stop any speech that might be playing
        context.voice.stopSpeech();

        const languageModel = context.languageModel;
        const speech = context.speechBuffer.trim();
        const response = await languageModel.invoke(speech);

        const speechResponseTime =
          performance.now() - context.speechResponseStartTime;
        context.speechResponseTime = Math.round(speechResponseTime);
        context.speechResponseStartTime = 0;

        logger.verbose("response from language model", {
          speechResponseTime
        });

        try {
          if (response.type === "say" && !response.content) {
            logger.verbose("call might already be hung up");
            return;
          } else if (response.type === "hangup") {
            const message = context.goodbyeMessage;
            await context.voice.say(message);
            await context.voice.hangup();
            return;
          } else if (response.type === "transfer") {
            logger.verbose("transferring call to a number in the pstn", {
              phoneNumber: context.transferPhoneNumber
            });

            const message = context.transferMessage!;
            await context.voice.say(message);
            await context.voice.stopStreams();
            await context.voice.transfer(context.transferPhoneNumber!, {
              record: true,
              timeout: 30
            });
            return;
          }

          await context.voice.say(response.content!);
        } catch (error) {
          logger.error("error processing user request", {
            error
          });

          await context.voice.say(context.systemErrorMessage);
        }
      }
    )
  }
}).createMachine({
  context: ({ input }) => ({
    sessionRef: input.voice.sessionRef,
    voice: input.voice,
    languageModel: input.languageModel,
    speechBuffer: "",
    firstMessage: input.conversationSettings.firstMessage,
    goodbyeMessage: input.conversationSettings.goodbyeMessage,
    transferMessage: input.conversationSettings.transferOptions?.message,
    transferPhoneNumber:
      input.conversationSettings.transferOptions?.phoneNumber,
    systemErrorMessage: input.conversationSettings.systemErrorMessage,
    idleMessage: input.conversationSettings.idleOptions?.message || "",
    idleTimeout: input.conversationSettings.idleOptions?.timeout || 10000,
    maxIdleTimeoutCount:
      input.conversationSettings.idleOptions?.maxTimeoutCount || 3,
    idleTimeoutCount: 0,
    maxSpeechWaitTimeout: input.conversationSettings.maxSpeechWaitTimeout,
    speechResponseStartTime: 0,
    speechResponseTime: 0,
    isSpeaking: false
  }),
  id: "fnAI",
  initial: "greeting",
  states: {
    greeting: {
      always: {
        target: "idle"
      },
      entry: {
        type: "greetUser"
      }
    },
    idle: {
      on: {
        SPEECH_START: {
          target: "waitingForUserRequest",
          description: "Event from VAD system."
        },
        SPEECH_RESULT: {
          target: "waitingForUserRequest",
          description: "Event from Speech to Text provider."
        }
      },
      after: {
        IDLE_TIMEOUT: [
          {
            target: "hangup",
            actions: {
              type: "goodbye"
            },
            guard: {
              type: "idleTimeoutCountExceedsMax"
            }
          },
          {
            target: "transitioningToIdle",
            actions: [
              {
                type: "increaseIdleTimeoutCount"
              },
              {
                type: "announceIdleTimeout"
              }
            ]
          }
        ]
      }
    },
    waitingForUserRequest: {
      always: {
        target: "updatingSpeech"
      },
      entry: [
        {
          type: "cleanSpeech"
        },
        {
          type: "interruptPlayback"
        },
        {
          type: "resetIdleTimeoutCount"
        },
        {
          type: "setSpeaking"
        }
      ]
    },
    hangup: {
      type: "final"
    },
    transitioningToIdle: {
      always: {
        target: "idle"
      }
    },
    updatingSpeech: {
      on: {
        SPEECH_RESULT: [
          {
            target: "processingUserRequest",
            actions: {
              type: "appendSpeech"
            },
            guard: {
              type: "isNotSpeaking"
            },
            description: "Speech result from the Speech to Text provider."
          },
          {
            target: "updatingSpeech",
            actions: {
              type: "appendSpeech"
            }
          }
        ],
        SPEECH_END: [
          {
            target: "processingUserRequest",
            actions: {
              type: "setSpeakingDone"
            },
            guard: {
              type: "hasSpeechResult"
            },
            description: "Event from VAD or similar system."
          },
          {
            target: "updatingSpeech",
            actions: {
              type: "setSpeakingDone"
            }
          }
        ]
      },
      after: {
        MAX_SPEECH_WAIT_TIMEOUT: {
          target: "processingUserRequest"
        }
      }
    },
    processingUserRequest: {
      on: {
        SPEECH_START: {
          target: "waitingForUserRequest",
          description: "Event from VAD or similar system."
        }
      },
      invoke: {
        src: "doProcessUserRequest",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "idle"
        }
      }
    }
  }
});

export { machine };
