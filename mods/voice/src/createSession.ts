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
import { StreamEvent, VoiceSessionStreamServer } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceHandler } from "./types";
import { VoiceResponse } from "./VoiceResponse";

const logger = getLogger({ service: "voice", filePath: __filename });

function createSession(handler: VoiceHandler) {
  return (voice: VoiceSessionStreamServer): Promise<void> =>
    new Promise((resolve) => {
      let mediaSessionRef: string;
      voice.once(StreamEvent.DATA, async (params) => {
        const { request } = params;

        if (request) {
          mediaSessionRef = request.mediaSessionRef;
          const response = new VoiceResponse(request, voice);

          // EventEmitter ignores the promise this callback returns, so an error
          // escaping the handler becomes an unhandled rejection and, under Node's
          // default policy, takes the whole voice server down with it. Verbs now
          // reject when the session ends mid-call, which makes reaching here an
          // ordinary occurrence rather than a defect in the application.
          try {
            await handler(request, response);
          } catch (e) {
            logger.warn("voice handler did not complete", {
              mediaSessionRef,
              error: e instanceof Error ? e.message : e
            });
          }

          resolve();
        }
      });

      voice.once(StreamEvent.END, () => {
        logger.verbose("session ended", { mediaSessionRef });
        voice.end();
        resolve();
      });
    });
}

export { createSession };
