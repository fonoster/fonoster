/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import logger from "@fonos/logger";
import {objectToQString} from "../utils";
import {Verb} from "../verb";
import {TransferOptions} from "./types";

export default class TransferVerb extends Verb {
  async run(destination: string, options: TransferOptions = {}): Promise<void> {
    logger.verbose(
      `@fonos/voice transfering call [sessionId = ${this.request.sessionId}, number = ${this.request.number}]`
    );

    // We should reject if CallTransferFailed
    return new Promise(async (resolve, reject) => {
      let callTransferingToken: string;
      let callTFailedToken: string;
      try {
        callTransferingToken = PubSub.subscribe(
          `CallTransfering.${this.request.sessionId}`,
          (type, data) => {
            resolve();
            PubSub.unsubscribe(callTransferingToken);
            PubSub.unsubscribe(callTFailedToken);
          }
        );

        callTransferingToken = PubSub.subscribe(
          `CallTransferFailed.${this.request.sessionId}`,
          (type, data) => {
            reject(data.error);
            PubSub.unsubscribe(callTransferingToken);
            PubSub.unsubscribe(callTFailedToken);
          }
        );

        await super.post(
          `events/user/Transfer`,
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
        PubSub.unsubscribe(callTransferingToken);
        PubSub.unsubscribe(callTFailedToken);
      }
    });
  }
}
