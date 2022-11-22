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
import logger from "@fonoster/logger";
import PubSub from "pubsub-js";
import { objectToQString } from "../utils";
import { Verb } from "../verb";
import { assertsHasDtmf } from "./asserts";
import { DtmfOptions } from "./types";

export default class DtmfVerb extends Verb {
  async run(opts: DtmfOptions): Promise<void> {
    logger.verbose(
      `@fonoster/voice sending dtmf request [sessionId = ${
        this.request.sessionId
      }, opts = ${JSON.stringify(opts)}]`
    );

    assertsHasDtmf(opts);

    return new Promise(async (resolve, reject) => {
      let token;
      try {
        token = PubSub.subscribe(
          `SendDtmfFinished.${this.request.sessionId}`,
          (type, data) => {
            resolve();
            PubSub.unsubscribe(token);
          }
        );

        await super.post(
          "events/user/SendDtmf",
          objectToQString({
            // WARNING: Harcoded value
            application: "mediacontroller"
          }),
          {
            variables: {
              sessionId: this.request.sessionId,
              dtmf: opts.dtmf
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
