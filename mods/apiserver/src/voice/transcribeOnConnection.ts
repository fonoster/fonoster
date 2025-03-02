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
import { Stream } from "stream";
import { getLogger } from "@fonoster/logger";
import { AudioStream } from "@fonoster/streams";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function transcribeOnConnection(stream: Stream) {
  return async (_, res: AudioStream) => {
    logger.verbose("starting instance of audio stream for transcription");
    res
      .onData((data) => {
        stream.emit("data", data);
      })
      .onError((err) => {
        logger.error("stream error:", err);
      });
  };
}

export { transcribeOnConnection };
