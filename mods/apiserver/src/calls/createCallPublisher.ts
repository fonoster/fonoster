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
import { natsConnectOptions, NatsTarget } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  connect,
  ErrorCode,
  NatsConnection,
  NatsError,
  StringCodec
} from "nats";
import { CALLS_CREATE_SUBJECT } from "../envs";
import { CallPlacementError, CreateCallRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/**
 * How long CreateCall waits for a node to accept the call's room: up to three nodes at the
 * media-control reply timeout (2 s) each, plus margin.
 */
const PLACE_TIMEOUT_MS = 8000;

async function createCallPublisher(nats: NatsTarget) {
  const options = natsConnectOptions(nats);
  logger.verbose("connecting to nats", { natsUrl: options.servers });

  const nc = await connect({ ...options, maxReconnectAttempts: -1 });
  return callPublisher(nc);
}

/** The CallPublisher over an open NATS connection. */
function callPublisher(nc: NatsConnection) {
  return {
    /**
     * Asks the outbound placement (any replica's `calls.create` queue group) to place the call,
     * and resolves once a media node has accepted its room. Rejects with a CallPlacementError:
     * `no_capacity` when no node took it, `unavailable` when no replica answered.
     */
    publishCall: async (request: CreateCallRequest & { ref: string }) => {
      logger.verbose("placing call", { ref: request.ref });

      let reply: Record<string, unknown>;
      try {
        const msg = await nc.request(
          CALLS_CREATE_SUBJECT,
          sc.encode(JSON.stringify(request)),
          { timeout: PLACE_TIMEOUT_MS }
        );
        reply = JSON.parse(sc.decode(msg.data));
      } catch (e) {
        const code = (e as NatsError).code;
        throw new CallPlacementError(
          "unavailable",
          code === ErrorCode.NoResponders
            ? "no call placement is running"
            : `call placement did not answer: ${(e as Error).message}`
        );
      }
      if (reply.type !== "ack") {
        throw new CallPlacementError(
          String(reply.code ?? "error"),
          String(reply.message ?? "the call could not be placed")
        );
      }
    }
  };
}

export { callPublisher, createCallPublisher };
