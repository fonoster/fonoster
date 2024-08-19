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
import { setup } from "xstate";
import { types } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export const machine = setup({
  types,
  actions: {
    sendGreeting: async function ({ context }) {
      await context.voice.answer();
      await context.voice.say(context.firstMessage);
    },
    interruptAISpeaking: function () {
      logger.verbose("interruptAISpeaking");
    },
    processHumanRequest: async function ({ context, event }) {
      const speech = (event as { speech: string }).speech;
      logger.verbose("human request", { speech });

      const response = await context.assistant.invoke({
        text: speech
      });

      logger.verbose("assistant response", { response });

      await context.voice.say(response);
    },
    hangup: async function ({ context }) {
      await context.voice.hangup();
    }
  }
}).createMachine({
  context: ({ input }) => ({
    firstMessage: input.firstMessage,
    voice: input.voice,
    assistant: input.assistant
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
