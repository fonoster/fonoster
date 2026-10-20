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
import {
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, CreateCallRequest } from "@fonoster/types";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { struct } from "pb-util";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "../core/db";
import { notFoundError } from "../core/notFoundError";
import { IsWorkspaceNumber } from "./createIsWorkspaceNumber";
import { CallPlacementError, CallPublisher } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * Asks whether an outbound call may start (add-billing-service D7). A refusal names its reason;
 * an unanswered or failed check admits the call.
 */
type AdmitCall = (request: {
  callRef: string;
  appRef: string;
  accessKeyId: string;
  from: string;
  to: string;
}) => Promise<{ authorized: boolean; reason?: string }>;

function createCall(
  prisma: Prisma,
  publisher: CallPublisher,
  isWorkspaceNumber: IsWorkspaceNumber,
  admitCall?: AdmitCall
) {
  const fn = async (
    call: {
      request: CreateCallRequest;
    },
    callback: (error?: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { from, to, appRef, timeout, metadata } = request;
    const ref = uuidv4();
    const effectiveMetadata = metadata ? struct.decode(metadata) : {};

    // Not the whole request: metadata may carry the app's secrets (M11).
    logger.verbose("call to createCall", { ref, appRef });

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    const app = await prisma.application.findUnique({
      where: { ref: appRef, accessKeyId }
    });

    if (!app) {
      throw notFoundError(`Application with ref ${appRef} not found`);
    }

    // `from` picks the trunk the call leaves by (X-Dod-Number), so it must be one of the
    // workspace's own Numbers; another workspace's number is reported like an unknown one.
    if (!(await isWorkspaceNumber(accessKeyId, from))) {
      callback({
        code: status.PERMISSION_DENIED,
        message: `The number ${from} is not a Number of this workspace`
      });
      return;
    }

    // Admission before any SIP (voice-session, "Calls are admitted before they start").
    if (admitCall) {
      const decision = await admitCall({
        callRef: ref,
        appRef,
        accessKeyId,
        from,
        to
      });
      if (!decision.authorized) {
        const reason = decision.reason ?? "not_authorized";
        logger.info("call refused", { ref, reason });
        callback({
          code: status.FAILED_PRECONDITION,
          message: `The call was refused: ${reason}`
        });
        return;
      }
    }

    // Placement answers once a Roomr node has accepted the call, so a call with no capacity
    // fails here (RESOURCE_EXHAUSTED) instead of TrackCall reporting FAILED later.
    try {
      await publisher.publishCall({
        ref,
        from,
        to,
        appRef,
        accessKeyId,
        timeout: timeout || 30,
        metadata: effectiveMetadata
      });
    } catch (e) {
      if (!(e instanceof CallPlacementError)) throw e;
      logger.warn("call not placed", { ref, code: e.code, message: e.message });
      const code =
        {
          no_capacity: status.RESOURCE_EXHAUSTED,
          invalid_argument: status.INVALID_ARGUMENT,
          already_exists: status.ALREADY_EXISTS
        }[e.code] ?? status.UNAVAILABLE;
      callback({
        code,
        message:
          code === status.RESOURCE_EXHAUSTED
            ? `No capacity to place the call: ${e.message}`
            : `The call could not be placed: ${e.message}`
      });
      return;
    }

    callback(null, { ref });
  };

  return withErrorHandlingAndValidation(fn, V.createCallRequestSchema);
}

export { AdmitCall, createCall };
