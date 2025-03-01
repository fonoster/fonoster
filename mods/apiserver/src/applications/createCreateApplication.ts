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
  AUTOPILOT_SPECIAL_LOCAL_ADDRESS,
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  withErrorHandling
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, CreateApplicationRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { ApplicationType } from "@prisma/client";
import { Prisma } from "../core/db";
import { convertToApplicationData } from "./utils/convertToApplicationData";
import { validOrThrow } from "./validation/validOrThrow";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createCreateApplication(prisma: Prisma) {
  const createApplication = async (
    call: { request: CreateApplicationRequest },
    callback: (error: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { type } = request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to createApplication", {
      accessKeyId,
      type
    });

    if (type === ApplicationType.AUTOPILOT && !request.endpoint) {
      logger.verbose("setting default endpoint for autopilot application", {
        autopilotEndpoint: AUTOPILOT_SPECIAL_LOCAL_ADDRESS
      });
      request.endpoint = AUTOPILOT_SPECIAL_LOCAL_ADDRESS;
    }

    validOrThrow(request);

    const result = await prisma.application.create({
      data: {
        ...convertToApplicationData(request),
        accessKeyId
      }
    });

    callback(null, { ref: result.ref });
  };

  return withErrorHandling(createApplication);
}

export { createCreateApplication };
