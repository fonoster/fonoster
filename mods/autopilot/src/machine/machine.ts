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
      logger.verbose("called hasSpeechResult guard", {
        speechBuffer: context.speechBuffer
      });
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
  after: {
    SESSION_TIMEOUT: {
      target: "hangup",
      actions: ["goodbye"]
    }
  }
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDMB2BBAkgOigJzDABcBLVKAYgG0AGAXUVAAcB7WE0l1RkAD0QCMADgHYAzAHYAnADYJYgExCaMmSJkAaEAE9EUsQFZsUiaoUGpAhQsMSAvna1os2EhAA2YCgGUACgFF-AGEACQB9bwAVdAAlSNoGJBBWdk5uJP4EAQMAFiFxHLkJbLEaAxkBCS1dLIEcnPFFZSkpHIklQwcnDBw3Tx8A4PCY-28AVQAZePoeFI4SLh5MyzFsBUrzHJMrAxtqxAkcoxyFHMqt0pbsrpBnXo8vXlgiAEMiMGwX5He8AApMAAiE38YUimAAsv4APJjSIASgod1cDwSszY80WGUQMgMRgEUhokgMYjyMlKAn2WQUJmwEnK23a5jEQhuSL6j2ebw+Xx+-yBILBkJh8MRPWRnioAkSzHRaSWgjqNGwQnkNAU0iEYi1VR0emy2Bk+iOpU1bRkrLFRDwL1QqQWqDIUEiLEwD2oMySczlWIQygUtOyORohX0uLJlKkBlE7WJNEqZJVKgtLncJGeYAd5GdY1gYDwA0CoTC-gAcgDUZ7Zfb5VkNdgDMUVAZTYGDJSxDjjMShLGJNI+wJzY5bmLU+nM06WDm8wWhsWy5Lpckq5jQJkBGVRKdTKozhZLO2o8qtQY44dynSysmcGP3hPs7n835C8NRpNpkuvdWfZUpPkGwIVjWJquQKBGg7GB2ZQ0CYYhSDY17YAA7i88zkAAYiweDeEwhAAMYABaRCQAC2YAsAArkQs5FlEsQfmidqrnwggduIzYKCopw0DQdLlJSuISNgbRBpY1LrKcOSIShaFQJh2G4WAhHEWRlHUc+c4jOMUwVjKTHpGuiBiHU9YqFs6y8SqFSUiI4jWJYBKamSJIGNJqGkBhWE4fhRGkeRVEUE8rzvJ83x5r84LoAAGhEgxFgA6lgkSghC0KwgiSIyR5cleYpyl+WpunLvpNZ5A0Hb1AmwaSZS5iiLsWpklYwg9hILLDpl7mOvJ3lKb5qkBUFXKhbykUxRpCVJSlQrpaKLhZd1uU+Sp-lEIujEYgZLEIKeeK4lsgFtW1pRtrqO0CKswZRsGZJBsIQ7dC4TB4CweFwOw5DTngMRgAAjhRcDURAXAfGQABuLAANYfEiz2ve9jpfT9-2Awg4OvW89oJEVX7MeuuwyNgarNpU8akqdNRWPUxg8TQQjrDI9lSR1Ypw29sAfVASN-QDzw0eEdFxDjK5beuPYNJqhyWGamp05SchGHIvEXUIhrGQIDjDqgLAQHAPB3Bt3qGQgAC0F2E8SphCH+GqHEolIm0YLTO-T1u5Gq9SIfghDZYb37GybQj-pIag2zbJxCBGCiE200ikko9TyIh7J+3jiANv6FSDtSFSJ4SUcx328HBoSdKdCzLhWja+mOs6rqeKnot6kY5JRpIzIkh2EZbMq8GM8ISjwQ2iG3hmtdTo+jc1tkEEcXBKzWzIvGUhIKjGNS0iAcyZ6uRXOALZ5CnLQVVFTz60fYC1JxFzxOL8Wd8+0qcViEtH8inIhBE2lAFFMGfxuARMiIP8eQ6Z00MJHM6F1rDCVMDBOkcCVAPRHE9F67NObcxRs8f+21rBHiOvBQcZwWianlgScQJho7kkULkXeDggA */
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
        target: "idle",
        description: "Transition to idle after the initial greeting."
      },
      entry: {
        type: "greetUser"
      }
    },

    idle: {
      entry: { type: "cleanSpeech" },
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "Event from VAD system."
        },
        SPEECH_RESULT: {
          target: "listeningToUser",
          description: "Detected speech before SPEECH_START event.",
          actions: [{ type: "appendSpeech" }]
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
        SPEECH_END: [
          {
            target: "processingUserRequest",
            guard: "hasSpeechResult",
            actions: [{ type: "setSpeakingDone" }],
            description:
              "Process the request immediately since we already speech."
          },
          {
            target: "waitingForSpeechTimeout",
            guard: not("hasSpeechResult"),
            actions: [{ type: "setSpeakingDone" }],
            description:
              "Wait for more speech since we don't have any speech yet."
          }
        ],
        SPEECH_RESULT: [
          {
            actions: { type: "appendSpeech" },
            guard: "isSpeaking",
            description:
              "The user is still speaking. With only want to append the speech."
          }
        ]
      }
    },

    waitingForSpeechTimeout: {
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "User started speaking again."
        },
        SPEECH_RESULT: {
          target: "processingUserRequest",
          actions: {
            type: "appendSpeech"
          },
          description: "Append final speech and process the request."
        }
      },
      after: {
        MAX_SPEECH_WAIT_TIMEOUT: [
          {
            target: "processingUserRequest",
            description:
              "Proceed to process the request as we have speech and the user is not speaking.",
            guard: "hasSpeechResult"
          },
          {
            target: "idle",
            description:
              "We have no speech and the user is not speaking. Return to idle."
          }
        ]
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
