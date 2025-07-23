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
  getTokenFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, UpdateUserRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getAccessKeyIdFromToken } from "../utils";
import { UserUpdateInput } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

function createUpdateUser(prisma: Prisma) {
  const updateUser = async (
    call: { request: UpdateUserRequest },
    callback: (error: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { ref, name, avatar, password, phone } = request;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const accessKeyId = getAccessKeyIdFromToken(token);

    logger.verbose("call to updateUser", { ref, password });

    const updateData = {
      name,
      avatar,
      password: password || undefined,
      updatedAt: new Date()
    } as UserUpdateInput;

    if (phone && phone !== "") {
      updateData.phoneNumber = phone;
      updateData.phoneNumberVerified = false;
    }

    await prisma.user.update({
      where: {
        ref,
        accessKeyId
      },
      data: updateData
    });

    const response: BaseApiObject = {
      ref
    };

    callback(null, response);
  };

  return withErrorHandlingAndValidation(updateUser, V.updateUserRequestSchema);
}

export { createUpdateUser };
