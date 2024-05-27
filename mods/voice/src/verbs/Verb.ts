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
import { toCamelCase } from "@fonoster/common";
import logger from "@fonoster/logger";
import { z } from "zod";
import { DATA, VerbRequest, VoiceRequest, VoiceSessionStream } from "./types";
import { validateRequest } from "./validateRequest";

abstract class Verb<T extends VerbRequest = VerbRequest> {
  request: VoiceRequest;
  voice: VoiceSessionStream;
  constructor(request: VoiceRequest, voice: VoiceSessionStream) {
    this.request = request;
    this.voice = voice;
  }

  async run(params?: T): Promise<void> {
    const { sessionId } = this.request;
    const { voice } = this;

    logger.verbose(`sending a ${this.constructor.name} request`, { sessionId });

    return new Promise((resolve, reject) => {
      try {
        const fullRequest = {
          ...params,
          sessionId
        };

        validateRequest<T>(this.getValidationSchema(), fullRequest);

        voice.write({
          [`${toCamelCase(this.constructor.name)}Request`]: fullRequest
        });

        const dataListener = () => {
          logger.verbose(`received ${this.constructor.name} response`, {
            sessionId
          });
          resolve();
          voice.removeListener(DATA, dataListener);
        };

        voice.on(DATA, dataListener);
      } catch (e) {
        reject(e);
      }
    });
  }

  abstract getValidationSchema(): z.Schema;
}

export { Verb };
