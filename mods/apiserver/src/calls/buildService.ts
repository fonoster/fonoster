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
import { AuthzClient } from "@fonoster/authz";
import { getLogger } from "@fonoster/logger";
import SDK from "@routr/sdk";
import { connect } from "nats";
import { prisma } from "../core/db";
import { routrConfig } from "../core/routrConfig";
import {
  AUTHZ_SERVICE_ENABLED,
  AUTHZ_SERVICE_HOST,
  AUTHZ_SERVICE_PORT,
  NATS,
  NATS_CONNECTION
} from "../envs";
import {
  createFetchCallsFromIndex,
  createFetchSingleCallFromIndex,
  RecordsDb
} from "../records";
import { AdmitCall, createCall } from "./createCall";
import { createCallPublisher } from "./createCallPublisher";
import { createIsWorkspaceNumber } from "./createIsWorkspaceNumber";
import { createTrackCall } from "./createTrackCall";
import { getCall } from "./getCall";
import { listCalls } from "./listCalls";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** An answer slower than this admits the call (add-billing-service D7). */
const ADMISSION_TIMEOUT_MS = 500;

/** Outbound admission from the authorization service, when it is enabled. */
function authzAdmission(): AdmitCall | undefined {
  if (!AUTHZ_SERVICE_ENABLED) return undefined;
  const client = new AuthzClient(`${AUTHZ_SERVICE_HOST}:${AUTHZ_SERVICE_PORT}`);
  return (request) =>
    client
      .checkSession(
        {
          accessKeyId: request.accessKeyId,
          appRef: request.appRef,
          callRef: request.callRef,
          callerNumber: request.from,
          ingressNumber: request.to,
          callDirection: "TO_PSTN"
        },
        ADMISSION_TIMEOUT_MS
      )
      .catch((e: Error) => {
        logger.warn("call admitted without an answer from authorization", {
          callRef: request.callRef,
          error: e.message
        });
        return { authorized: true };
      });
}

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
        createIsWorkspaceNumber(new SDK.Numbers(routrConfig)),
        authzAdmission()
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
