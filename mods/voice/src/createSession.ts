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
import {
  DATA,
  END,
  ERROR,
  PluginsObject,
  VoiceHandler,
  VoiceSessionStream
} from "./types";
import { VoiceResponse } from "./VoiceResponse";

const logger = getLogger({ service: "voice", filePath: __filename });

function createSession(handler: VoiceHandler, plugins: PluginsObject) {
  return (voice: VoiceSessionStream) => {
    voice.on(DATA, (params) => {
      const { request } = params;

      if (params.request) {
        const response = new VoiceResponse({
          voice,
          request,
          plugins
        });

        handler(request, response);
      }
    });

    voice.on(END, () => {
      logger.info("stream ended");
      voice.end();
    });

    voice.on(ERROR, (error) => {
      logger.error("stream error", error);
    });
  };
}

export { createSession };
