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
import ariClient from "ari-client";
import { connect } from "nats";
import { CreateCallRequest } from "./types";
import {
  ASTERISK_CONTEXT,
  ASTERISK_EXTENSION,
  ASTERISK_SYSTEM_DOMAIN,
  ASTERISK_TRUNK,
  CALLS_CREATE_SUBJECT,
  DEFAULT_NATS_QUEUE_GROUP
} from "../envs";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type CallManagerConfig = {
  natsUrl: string;
  ariProxyUrl: string;
  ariUsername: string;
  ariPassword: string;
};

async function createCreateCallSubscriber(config: CallManagerConfig) {
  const { natsUrl, ariProxyUrl, ariUsername, ariPassword } = config;

  try {
    logger.verbose("connecting to nats", { natsUrl });

    const nc = await connect({ servers: natsUrl });

    logger.verbose("subscribing to call create subject", {
      subject: CALLS_CREATE_SUBJECT
    });

    const subscription = nc.subscribe(CALLS_CREATE_SUBJECT, {
      queue: DEFAULT_NATS_QUEUE_GROUP
    });

    logger.verbose("connecting to ari", { ariProxyUrl });

    const ariConn = await ariClient.connect(
      ariProxyUrl,
      ariUsername,
      ariPassword
    );

    subscription.callback = async (err, msg) => {
      if (err) {
        logger.error(err);
      }

      const { ref, from, to, appRef, accessKeyId, timeout } =
        msg.json() as CreateCallRequest & {
          ref: string;
          accessKeyId: string;
        };

      logger.verbose("received a new call request", {
        ...msg.json()
      });

      // eslint-disable-next-line new-cap
      const channel = ariConn.Channel();

      channel
        .originate({
          context: ASTERISK_CONTEXT,
          extension: ASTERISK_EXTENSION,
          endpoint: `PJSIP/${ASTERISK_TRUNK}/sip:${to}@${ASTERISK_SYSTEM_DOMAIN}`,
          timeout,
          variables: {
            "PJSIP_HEADER(add,X-Call-Ref)": ref,
            "PJSIP_HEADER(add,X-Dod-Number)": from,
            "PJSIP_HEADER(add,X-Access-Key-Id)": accessKeyId,
            "PJSIP_HEADER(add,X-Is-Api-Originated-Type)": "true",
            INGRESS_NUMBER: from,
            APP_REF: appRef
          }
        })
        .catch((err) => {
          logger.error("error creating call", { err });
        });
    };
  } catch (e) {
    logger.error("error connecting to ari", { e });
  }
}

export { createCreateCallSubscriber };
