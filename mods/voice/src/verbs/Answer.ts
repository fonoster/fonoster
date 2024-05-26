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
import { Verb } from "./Verb";
import { DATA } from "../types";

const logger = getLogger({ service: "voice", filePath: __filename });

class Answer extends Verb {
  async run(): Promise<void> {
    const { sessionId } = this.request;

    logger.verbose("sending answer request", { sessionId });

    return new Promise((resolve, reject) => {
      try {
        this.voice.write({ sessionId });
        this.voice.on(DATA, (payload) => {
          const { answerResponse: response } = payload;

          logger.verbose("received answer response", { sessionId });

          if (response?.sessionId === sessionId) {
            resolve();
          } else {
            // TODO: Should be a gRPC error
            reject(new Error("invalid session id"));
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

export { Answer };
