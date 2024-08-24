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
import { VoiceResponse } from "@fonoster/voice";
import { Assistant } from "../assistants/assistants";

const types = {
  context: {} as {
    firstMessage: string;
    voice: VoiceResponse;
    assistant: Assistant;
    playbackRef: string;
    speechBuffer: string;
  },
  input: {} as {
    firstMessage: string;
    voice: VoiceResponse;
    assistant: Assistant;
  },
  events: {} as
    | { type: "SPEECH_START" }
    | { type: "SPEECH_END" }
    | { type: "SESSION_END" }
    | { type: "HUMAN_PROMPT"; speech: string }
};

export { types };
