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
import { VoiceHandler } from "./types";
import { DATA, VoiceSessionStream } from "./verbs/types";
import { VoiceResponse } from "./VoiceResponse";

function createSession(handler: VoiceHandler) {
  return (voice: VoiceSessionStream): Promise<void> =>
    new Promise((resolve) => {
      voice.on(DATA, async (params) => {
        const { request } = params;

        if (params.request) {
          const response = new VoiceResponse(request, voice);
          await handler(request, response);
          resolve();
        }
      });
    });
}

export { createSession };
