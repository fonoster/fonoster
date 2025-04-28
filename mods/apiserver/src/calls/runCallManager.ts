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
import { CALL_CONTEXT, CALL_EXTENSION } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import ariClient from "ari-client";
import { connect } from "nats";
import {
  ASTERISK_SYSTEM_DOMAIN,
  ASTERISK_TRUNK,
  CALLS_CREATE_SUBJECT,
  DEFAULT_NATS_QUEUE_GROUP
} from "../envs";
import { CreateCallRequest } from "./types";

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

    const nc = await connect({ servers: natsUrl, maxReconnectAttempts: -1 });

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

      const { ref, from, to, appRef, accessKeyId, timeout, metadata } =
        msg.json() as CreateCallRequest & {
          ref: string;
          accessKeyId: string;
        };

      logger.verbose("received a new call request", {
        ...msg.json()
      });

      await ariConn.channels.originate({
        context: CALL_CONTEXT,
        extension: CALL_EXTENSION,
        endpoint: `PJSIP/${ASTERISK_TRUNK}/sip:${to}@${ASTERISK_SYSTEM_DOMAIN}`,
        timeout,
        variables: {
          "PJSIP_HEADER(add,X-Call-Ref)": ref,
          "PJSIP_HEADER(add,X-Dod-Number)": from,
          "PJSIP_HEADER(add,X-Access-Key-Id)": accessKeyId,
          "PJSIP_HEADER(add,X-Is-Api-Originated-Type)": "true",
          CALL_DIRECTION: "peer-to-pstn",
          INGRESS_NUMBER: from,
          APP_REF: appRef,
          METADATA: JSON.stringify(metadata)
        }
      });
    };
  } catch (e) {
    logger.error("error connecting to ari", e);
  }
}

export { createCreateCallSubscriber };
