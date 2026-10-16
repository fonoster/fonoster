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
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, CreateUserRequest } from "@fonoster/types";
import { status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { isMethodEnabled, isOpenSignup } from "../utils/authMethods";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { passwordColumns } from "../utils/userPasswords";

const logger = getLogger({ service: "identity", filePath: __filename });

/**
 * Self-service sign-up with a password. Allowed only when sign-up is open and
 * password sign-in is enabled; invited users are created by the invite.
 */
function createCreateUser(prisma: Prisma, identityConfig: IdentityConfig) {
  const createUser = async (
    call: { request: CreateUserRequest },
    callback: (error?: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { name, email, password, avatar, phone } = request;

    logger.verbose("call to createUser", { email });

    if (
      !isOpenSignup(identityConfig) ||
      !isMethodEnabled(identityConfig, "password")
    ) {
      return callback({
        code: status.PERMISSION_DENIED,
        message: "Sign-up is by invitation only"
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        accessKeyId: generateAccessKeyId(AccessKeyIdType.USER),
        ...(await passwordColumns(password)),
        avatar,
        phoneNumber: phone || undefined
      }
    });

    const { ref } = user;

    callback(null, { ref });
  };

  return withErrorHandlingAndValidation(createUser, V.createUserRequestSchema);
}

export { createCreateUser };
