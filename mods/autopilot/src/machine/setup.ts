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
import { setup } from "xstate";
import { AutopilotContext } from "./types";
import { ConversationSettings } from "../assistants";
import { LanguageModel } from "../models";
import { Voice } from "../voice";
import * as actors from "./actors";
import * as guards from "./guards";
import * as actions from "./actions";
import delays from "./delays";

const machineSetup = setup({
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
      | { type: "SPEECH_RESULT"; speech: string, responseTime: number }
  },
  actions,
  guards,
  delays,
  actors,
  after: {
    SESSION_TIMEOUT: {
      target: "hangup",
      actions: ["goodbye"]
    }
  }
});

export { machineSetup };
