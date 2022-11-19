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
import { DialOptions } from "./types";
import StatusStream from "./status_stream";
import { Stream } from "stream";

export default class DialVerb extends Verb {
  async run(
    destination: string,
    options: DialOptions = {}
  ): Promise<StatusStream> {
    const streamStatus = new StatusStream();
    logger.verbose(
      `@fonoster/voice dialing [sessionId = ${this.request.sessionId}, number = ${this.request.number}]`
    );

    // We should reject if DialFailed
    return new Promise(async (resolve, reject) => {
      let dialFailedToken: string;
      let statusChangeToken: string;
      try {
        statusChangeToken = PubSub.subscribe(
          `DialStatusChanged.${this.request.sessionId}`,
          (type, d) => {
            if (d.data.status === "trying") {
              resolve(streamStatus);
            } else {
              streamStatus.emit(d.data.status, d.data);
            }
          }
        );

        dialFailedToken = PubSub.subscribe(
          `DialFailed.${this.request.sessionId}`,
          (type, data) => {
            reject(data.error);
            PubSub.unsubscribe(dialFailedToken);
            PubSub.unsubscribe(statusChangeToken);
          }
        );

        await super.post(
          "events/user/Dial",
          objectToQString({
            // WARNING: Harcoded value
            application: "mediacontroller"
          }),
          {
            variables: {
              accessKeyId: this.request.accessKeyId,
              sessionId: this.request.sessionId,
              // Could be a Number or an Agent
              destination,
              number: this.request.number,
              timeout: options.timeout || -1,
              record: options.record
            }
          }
        );
      } catch (e) {
        reject(e);
        PubSub.unsubscribe(dialFailedToken);
      }
    });
  }
}
