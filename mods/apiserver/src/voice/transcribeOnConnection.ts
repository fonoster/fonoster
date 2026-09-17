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
import { AudioFilterChain, bufferToInt16, int16ToBuffer } from "./filters";

const logger = getLogger({ service: "apiserver", filePath: __filename });

// About a second of audio. Past this the filter is not keeping up with the
// call, so frames skip it rather than piling up without bound.
const MAX_FRAMES_IN_FLIGHT = 50;

/**
 * Fans the caller's audio out to everything that consumes it: speech
 * recognition and the application's media stream.
 *
 * When the session has audio filters, frames run through the chain first, so
 * every consumer sees the same filtered audio. With no filters the buffer is
 * emitted synchronously, exactly as before.
 *
 * Frames are emitted in arrival order even while filters are being replaced
 * or removed: once anything is in flight, later frames queue behind it rather
 * than overtaking it on the unfiltered path.
 */
function transcribeOnConnection(
  stream: Stream,
  getFilterChain: () => AudioFilterChain | null = () => null
) {
  return async (_, res: AudioStream) => {
    logger.verbose("starting instance of audio stream for transcription");

    let queue: Promise<void> = Promise.resolve();
    let inFlight = 0;
    let warnedAboutBacklog = false;

    // Listeners run synchronously here, so one that throws must not take the
    // audio path down with it, and must never cause a frame to be emitted
    // twice
    const emit = (data: Buffer) => {
      try {
        stream.emit("data", data);
      } catch (err) {
        logger.warn("a consumer of the audio stream threw", { err });
      }
    };

    const handle = async (data: Buffer) => {
      const chain = getFilterChain();

      if (!chain) {
        emit(data);
        return;
      }

      if (inFlight > MAX_FRAMES_IN_FLIGHT) {
        if (!warnedAboutBacklog) {
          warnedAboutBacklog = true;
          logger.warn(
            "audio filters are behind real time; frames are skipping them",
            { framesInFlight: inFlight }
          );
        }
        emit(data);
        return;
      }

      try {
        emit(int16ToBuffer(await chain.process(bufferToInt16(data))));
      } catch (err) {
        logger.warn("audio filter chain failed; passing audio through", {
          err
        });
        emit(data);
      }
    };

    res
      .onData((data) => {
        // Nothing pending and no filters: keep the original synchronous path
        if (inFlight === 0 && !getFilterChain()) {
          emit(data);
          return;
        }

        inFlight++;
        queue = queue
          .then(() => handle(data))
          .catch((err) =>
            logger.error("unexpected error in the audio path", { err })
          )
          .finally(() => {
            inFlight--;
          });
      })
      .onError((err) => {
        logger.error("stream error:", err);
      });
  };
}

export { transcribeOnConnection };
