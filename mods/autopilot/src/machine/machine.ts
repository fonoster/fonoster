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
import { PlaybackControlAction } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceResponse } from "@fonoster/voice";
import { v4 as uuidv4 } from "uuid";
import { assign, raise, setup } from "xstate";
import { Assistant } from "../assistants/assistants";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const machine = setup({
  types: {
    context: {} as {
      assistant: Assistant;
      voice: VoiceResponse;
      playbackRef: string;
      firstMessage: string;
      goodbyeMessage: string;
      systemErrorMessage: string;
      idleMessage: string;
      idleTimeout: number;
      idleTimeoutCount: number;
      maxIdleTimeoutCount: number;
      speechBuffer: string;
      speechResponseStartTime: number;
      speechResponseTime: number;
    },
    input: {} as {
      assistant: Assistant;
      voice: VoiceResponse;
      firstMessage: string;
      goodbyeMessage: string;
      systemErrorMessage: string;
      idleMessage: string;
      idleTimeout: number;
      maxIdleTimeoutCount: number;
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

      await context.voice.say(context.firstMessage, {
        playbackRef: context.playbackRef
      });
    },
    goodbye: async ({ context }) => {
      logger.verbose("called goodbye action", {
        goodbyeMessage: context.goodbyeMessage
      });

      await context.voice.say(context.goodbyeMessage, {
        playbackRef: context.playbackRef
      });

      await context.voice.hangup();
    },
    announceSystemError: async ({ context }) => {
      logger.verbose("called announceSystemError action", {
        systemErrorMessage: context.systemErrorMessage
      });

      await context.voice.say(context.systemErrorMessage, {
        playbackRef: context.playbackRef
      });
    },
    interruptPlayback: async ({ context }) => {
      logger.verbose("called interruptPlayback action", {
        playbackRef: context.playbackRef
      });

      await context.voice.playbackControl(
        context.playbackRef,
        PlaybackControlAction.STOP
      );
    },
    processUserRequest: async ({ context }) => {
      logger.verbose("called processUserRequest action", {
        speechBuffer: context.speechBuffer
      });

      const speech = context.speechBuffer.trim();
      const response = await context.assistant.invoke({ text: speech });
      const speechResponseTime = Date.now() - context.speechResponseStartTime;
      context.speechResponseTime = speechResponseTime;
      context.speechBuffer = "";
      context.speechResponseStartTime = 0;

      await context.voice.say(response, {
        playbackRef: context.playbackRef
      });

      raise({ type: "USER_REQUEST_PROCESSED" });
    },
    announceIdleTimeout: async ({ context }) => {
      logger.verbose("called announceIdleTimeout action", {
        idleMessage: context.idleMessage
      });

      await context.voice.say(context.idleMessage, {
        playbackRef: context.playbackRef
      });
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
      context.speechBuffer = (context.speechBuffer || "") + " " + speech;
      context.speechResponseStartTime = Date.now();
      return context;
    }),
    resetIdleTimeoutCount: assign(({ context }) => {
      logger.verbose("called resetIdleTimeoutCount action", {
        idleTimeoutCount: 0
      });

      context.idleTimeoutCount = 0;
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
    speechNotEmpty: function ({ context }) {
      logger.verbose("called speechNotEmpty guard", {
        speechBuffer: context.speechBuffer
      });

      return context.speechBuffer !== "";
    }
  },
  delays: {
    IDLE_TIMEOUT: ({ context }) => {
      return context.idleTimeout;
    }
  }
}).createMachine({
  context: ({ input }) => ({
    voice: input.voice,
    assistant: input.assistant,
    playbackRef: uuidv4(),
    speechBuffer: "",
    firstMessage: input.firstMessage,
    goodbyeMessage: input.goodbyeMessage,
    systemErrorMessage: input.systemErrorMessage,
    idleMessage: input.idleMessage,
    idleTimeout: input.idleTimeout,
    maxIdleTimeoutCount: input.maxIdleTimeoutCount,
    idleTimeoutCount: 0,
    speechResponseStartTime: 0,
    speechResponseTime: 0
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
      },
      description:
        "Entry point for fnAI where the AI answer the call and greets the user."
    },
    idle: {
      on: {
        SPEECH_START: {
          target: "waitingForUserRequest",
          description: "Event from VAD or similar system."
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
            target: "hackingTimeout",
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
      },
      description: "Always come back home."
    },
    hangup: {
      type: "final",
      description: "Final state and end of session."
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
        }
      ],
      description: "The machine stays here until we get results from the STT."
    },
    hackingTimeout: {
      always: {
        target: "idle"
      },
      description: "Transitioning back to idle."
    },
    updatingSpeech: {
      on: {
        SPEECH_RESULT: {
          target: "updatingSpeech",
          actions: {
            type: "appendSpeech"
          },
          description: "Speech result from the Speech to Text provider."
        },
        SPEECH_END: [
          {
            target: "processingUserRequest",
            guard: {
              type: "speechNotEmpty"
            }
          },
          {
            target: "idle",
            actions: {
              type: "announceSystemError"
            },
            description: "Announce system error and reset the machine."
          }
        ]
      },
      description: "Collecting information from the user."
    },
    processingUserRequest: {
      on: {
        SPEECH_START: {
          target: "waitingForUserRequest",
          description: "Event from VAD or similar system."
        },
        USER_REQUEST_PROCESSED: {
          target: "idle",
          description: "Go back home."
        }
      },
      entry: [
        {
          type: "processUserRequest"
        }
      ],
      description:
        "Call the intelligence provider, respond to user, and update the response time."
    }
  }
});

export { machine };
