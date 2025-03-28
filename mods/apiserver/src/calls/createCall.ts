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
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { struct } from "pb-util";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "../core/db";
import { notFoundError } from "../core/notFoundError";
import { CallPublisher } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createCall(prisma: Prisma, publisher: CallPublisher) {
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

    logger.verbose("call to createCall", { ...request, ref });

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    const app = await prisma.application.findUnique({
      where: { ref: appRef, accessKeyId }
    });

    if (!app) {
      throw notFoundError(`Application with ref ${appRef} not found`);
    }

    publisher.publishCall({
      ref,
      from,
      to,
      appRef,
      accessKeyId,
      timeout: timeout || 30,
      metadata: effectiveMetadata
    });

    callback(null, { ref });
  };

  return withErrorHandlingAndValidation(fn, V.createCallRequestSchema);
}

export { createCall };
