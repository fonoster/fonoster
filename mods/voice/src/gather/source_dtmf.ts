import { GatherOptions } from "./types";
import PubSub from "pubsub-js";
import logger from "@fonos/logger";

const waitForDtmf =
  async (sessionId: string, options: GatherOptions): Promise<string> =>
    new Promise(async (resolve, reject) => {
      let token = null;
      try {
        let timer: NodeJS.Timeout;
        let digits = "";

        if (options.timeout) {
          timer = setTimeout(() => {
            resolve(digits);
            PubSub.subscribe(token);
          }, options.timeout);
        }

        const token = PubSub.subscribe(`DtmfReceived.${sessionId}`, (type, data) => {
          const key = data.data

          logger.verbose("data: " + JSON.stringify(data));
          logger.verbose("key: " + key);
          logger.verbose("digits: " + digits);

          if (timer) {
            clearTimeout(timer);
            timer = setTimeout(() => {
              resolve(digits);
              PubSub.subscribe(token);
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
            PubSub.subscribe(token);
          }
        })
      } catch (e) {
        reject(e);
        PubSub.subscribe(token);
      }
    });

export default waitForDtmf;