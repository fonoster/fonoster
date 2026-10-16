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
import {
  StreamEvent,
  toCamelCase,
  VerbRequest,
  VoiceIn,
  VoiceRequest,
  VoiceSessionStreamServer
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { getExpectedContent } from "./getExpectedContent";
import { validateRequest } from "./validateRequest";

const logger = getLogger({ service: "voice", filePath: __filename });

abstract class Verb<T extends VerbRequest = VerbRequest> {
  request: VoiceRequest;
  voice: VoiceSessionStreamServer;
  constructor(request: VoiceRequest, voice: VoiceSessionStreamServer) {
    this.request = request;
    this.voice = voice;
  }

  async run(params?: T): Promise<VoiceIn> {
    const { mediaSessionRef } = this.request;
    const { voice } = this;

    logger.verbose(`sending a request with the ${this.constructor.name} verb`, {
      mediaSessionRef
    });

    return new Promise((resolve, reject) => {
      // Every exit path must remove all three listeners. A verb shares the session
      // stream with every other verb in the call, so anything left attached
      // accumulates for the lifetime of the session.
      const cleanup = () => {
        voice.removeListener(StreamEvent.DATA, dataListener);
        voice.removeListener(StreamEvent.END, endListener);
        voice.removeListener(StreamEvent.ERROR, errorListener);
      };

      const dataListener = (result: VoiceIn) => {
        const expectedContent = getExpectedContent(this.constructor.name);

        if (expectedContent !== result.content) {
          return;
        }

        logger.verbose(`received ${this.constructor.name} response`, {
          mediaSessionRef
        });
        cleanup();
        resolve(result);
      };

      // Without these the promise has exactly one exit: a matching response. When the
      // session dies first — the caller hangs up mid-verb, or the transport fails —
      // it is left pending forever, neither resolved nor rejected. The application
      // then awaits a verb that can never complete and the call is stranded rather
      // than failed.
      const endListener = () => {
        cleanup();
        reject(
          new Error(
            `voice session ended before the ${this.constructor.name} verb completed`
          )
        );
      };

      const errorListener = (error: unknown) => {
        cleanup();
        reject(
          error instanceof Error
            ? error
            : new Error(
                `voice session failed during the ${this.constructor.name} verb: ${error}`
              )
        );
      };

      try {
        const fullRequest = {
          ...params,
          mediaSessionRef
        };

        validateRequest<T>(this.getValidationSchema(), fullRequest);

        // Listen before writing: a response cannot be delivered to a listener that
        // does not exist yet.
        voice.on(StreamEvent.DATA, dataListener);
        voice.on(StreamEvent.END, endListener);
        voice.on(StreamEvent.ERROR, errorListener);

        voice.write({
          [`${toCamelCase(this.constructor.name)}Request`]: fullRequest
        });
      } catch (e) {
        cleanup();
        reject(e);
      }
    });
  }

  abstract getValidationSchema(): z.Schema;
}

export { Verb };
