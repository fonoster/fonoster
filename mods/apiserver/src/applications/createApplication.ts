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
import {
  CreateApplicationRequest,
  CreateApplicationResponse,
  GrpcErrorMessage,
  handleError
} from "@fonoster/common";
import { getAccessKeyIdFromCall } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { convertToApplicationData } from "./utils/convertToApplicationData";
import { validOrThrow } from "./utils/validOrThrow";
import { Prisma } from "../core/db";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createApplication(prisma: Prisma) {
  return async (
    call: { request: CreateApplicationRequest },
    callback: (
      error: GrpcErrorMessage,
      response?: CreateApplicationResponse
    ) => void
  ) => {
    const { type } = call.request;
    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    try {
      logger.verbose("call to createApplication", {
        accessKeyId,
        type
      });

      validOrThrow(call.request);

      const result = await prisma.application.create({
        data: {
          ...convertToApplicationData(call.request),
          accessKeyId
        }
      });

      return callback(null, { ref: result.ref });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createApplication };
