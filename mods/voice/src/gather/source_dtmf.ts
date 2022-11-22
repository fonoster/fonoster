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
import { GatherOptions } from "./types";
import PubSub from "pubsub-js";

const waitForDtmf = async (
  sessionId: string,
  options: GatherOptions
): Promise<string> =>
  new Promise(async (resolve, reject) => {
    const token = null;
    try {
      let timer: NodeJS.Timeout;
      let digits = "";

      if (options.timeout > 0) {
        timer = setTimeout(() => {
          resolve(digits);
          PubSub.unsubscribe(token);
          return;
        }, options.timeout);
      }

      const token = PubSub.subscribe(
        `DtmfReceived.${sessionId}`,
        (type, data) => {
          const key = data.data;

          if (timer) {
            clearTimeout(timer);
            timer = setTimeout(() => {
              resolve(digits);
              PubSub.unsubscribe(token);
              return;
            }, options.timeout);
          }

          // We don't need to include finishOnKey
          if (options.finishOnKey != key) {
            digits += key;
          }

          if (
            digits.length >= options.numDigits ||
            key === options.finishOnKey
          ) {
            resolve(digits);
            PubSub.unsubscribe(token);
            return;
          }
        }
      );
    } catch (e) {
      reject(e);
      PubSub.unsubscribe(token);
    }
  });

export default waitForDtmf;
