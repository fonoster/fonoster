// @ts-nocheck - All inputs are validated by the APIServer
/*
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
import { assign, fromPromise, setup, and, not } from "xstate";
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
  },
  actions: {
    greetUser: async ({ context }): Promise<void> => {
      logger.verbose("called greetUser action", {
        firstMessage: context.firstMessage
      });

      await context.voice.answer();

      if (context.firstMessage) {
        await context.voice.say(context.firstMessage);
      }
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

      if (!speech) {
        return context;
      }

      context.speechBuffer = (
        (context.speechBuffer ?? "") +
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
    }),
    resetState: assign(({ context }) => {
      logger.verbose("called resetState action");
      return {
        ...context,
        speechBuffer: "",
        idleTimeoutCount: 0,
        isSpeaking: false
      };
    })
  },
  guards: {
    idleTimeoutCountExceedsMax: function ({ context }) {
      logger.verbose("called idleTimeoutCountExceedsMax guard", {
        idleTimeoutCount: context.idleTimeoutCount + 1,
        maxIdleTimeoutCount: context.maxIdleTimeoutCount
      });

      return context.idleTimeoutCount + 1 > context.maxIdleTimeoutCount;
    },
    hasSpeechResult: function ({ context }) {
      return context.speechBuffer;
    },
    isSpeaking: function ({ context }) {
      logger.verbose("called isSpeaking guard", {
        isSpeaking: context.isSpeaking
      });

      return context.isSpeaking;
    }
  },
  delays: {
    IDLE_TIMEOUT: ({ context }) => {
      return context.idleTimeout;
    },
    MAX_SPEECH_WAIT_TIMEOUT: ({ context }) => {
      return context.maxSpeechWaitTimeout;
    },
    SESSION_TIMEOUT: ({ context }) => {
      const elapsed = Date.now() - context.sessionStartTime;
      return Math.max(0, context.maxSessionDuration - elapsed);
    }
  },
  actors: {
    doProcessUserRequest: fromPromise(
      async ({ input }: { input: { context: AutopilotContext } }) => {
        const { context } = input;
        logger.verbose("called processUserRequest action", {
          speechBuffer: context.speechBuffer
        });

        // Stop any speech that might be playing
        context.voice.stopSpeech();

        const languageModel = context.languageModel;
        const speech = context.speechBuffer.trim();

        const response = await languageModel.invoke(speech);

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
  },
  on: {
    ERROR: {
      target: "systemError",
      actions: "logError"
    }
  },
  after: {
    SESSION_TIMEOUT: {
      target: "hangup",
      actions: ["goodbye"]
    }
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
    isSpeaking: false,
    sessionStartTime: Date.now(),
    maxSessionDuration: input.conversationSettings.maxSessionDuration
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
            actions: { type: "goodbye" },
            guard: and(["idleTimeoutCountExceedsMax", not("isSpeaking")])
          },
          {
            target: "idleTransition",
            guard: not("isSpeaking"),
            actions: [
              { type: "increaseIdleTimeoutCount" },
              { type: "announceIdleTimeout" }
            ]
          }
        ]
      }
    },
    idleTransition: {
      always: {
        target: "idle"
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
    updatingSpeech: {
      on: {
        SPEECH_END: {
          actions: [
            {
              type: "setSpeakingDone"
            }
          ]
        },
        SPEECH_RESULT: [
          {
            actions: {
              type: "appendSpeech"
            },
            guard: "isSpeaking",
            description: "Just append the speech result."
          },
          {
            target: "processingUserRequest",
            actions: {
              type: "appendSpeech"
            },
            guard: not("isSpeaking"),
            description: "Append the speech result and process it."
          }
        ]
      },
      after: {
        MAX_SPEECH_WAIT_TIMEOUT: [
          {
            target: "processingUserRequest",
            guard: "hasSpeechResult",
            actions: {
              type: "setSpeakingDone"
            }
          },
          {
            target: "idle",
            guard: not("isSpeaking")
          }
        ]
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
    },
    systemError: {
      entry: "announceSystemError",
      after: {
        SYSTEM_ERROR_RECOVERY_TIMEOUT: {
          target: "idle",
          actions: "resetState"
        }
      }
    }
  }
});

export { machine };
