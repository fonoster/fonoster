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
import { getLogger } from "@fonoster/logger";
import { connect } from "nats";
import { CALLS_CREATE_SUBJECT } from "../envs";
import { CreateCallRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

async function createCallPublisher(natsUrl: string) {
  logger.verbose("connecting to nats", { natsUrl });

  const nc = await connect({ servers: natsUrl, maxReconnectAttempts: -1 });

  return {
    publishCall: async (request: CreateCallRequest & { ref: string }) => {
      logger.verbose("publishing call", { ref: request.ref });

      nc.publish(CALLS_CREATE_SUBJECT, JSON.stringify(request));
    }
  };
}

export { createCallPublisher };
