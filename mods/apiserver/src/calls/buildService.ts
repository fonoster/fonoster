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
import SDK from "@routr/sdk";
import { connect } from "nats";
import { prisma } from "../core/db";
import { routrConfig } from "../core/routrConfig";
import { NATS, NATS_CONNECTION } from "../envs";
import {
  createFetchCallsFromIndex,
  createFetchSingleCallFromIndex,
  RecordsDb
} from "../records";
import { createCall } from "./createCall";
import { createCallPublisher } from "./createCallPublisher";
import { createIsWorkspaceNumber } from "./createIsWorkspaceNumber";
import { createTrackCall } from "./createTrackCall";
import { getCall } from "./getCall";
import { listCalls } from "./listCalls";

async function buildService() {
  const callPublisher = await createCallPublisher(NATS_CONNECTION);
  const nc = await connect({ ...NATS, maxReconnectAttempts: -1 });

  return {
    definition: {
      serviceName: "Calls",
      pckg: "calls",
      version: "v1beta2",
      proto: "calls.proto"
    },
    handlers: {
      createCall: createCall(
        prisma,
        callPublisher,
        createIsWorkspaceNumber(new SDK.Numbers(routrConfig))
      ),
      // Call history from the call-record index (add-call-record 7.1).
      listCalls: listCalls(
        createFetchCallsFromIndex(prisma as unknown as RecordsDb)
      ),
      getCall: getCall(
        createFetchSingleCallFromIndex(prisma as unknown as RecordsDb)
      ),
      trackCall: createTrackCall(nc)
    }
  };
}

export { buildService };
