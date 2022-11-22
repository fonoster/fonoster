/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import PubSub from "pubsub-js";
import logger from "@fonoster/logger";
import { objectToQString } from "../utils";
import { Verb } from "../verb";

export default class AnswerVerb extends Verb {
  async run(): Promise<void> {
    logger.verbose(
      `@fonoster/voice sending answer request [sessionId = ${this.request.sessionId}]`
    );

    return new Promise(async (resolve, reject) => {
      let token: string;
      try {
        token = PubSub.subscribe(
          `SessionOpen.${this.request.sessionId}`,
          (type, data) => {
            resolve();
            PubSub.unsubscribe(token);
          }
        );

        await super.post(
          "events/user/Answer",
          objectToQString({
            // WARNING: Harcoded value
            application: "mediacontroller"
          }),
          {
            variables: {
              sessionId: this.request.sessionId
            }
          }
        );
      } catch (e) {
        reject(e);
        PubSub.unsubscribe(token);
      }
    });
  }
}
