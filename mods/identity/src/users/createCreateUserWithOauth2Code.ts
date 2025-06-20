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
import { CreateUserWithOauth2CodeRequest } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import { customAlphabet } from "nanoid";
import { Prisma } from "../db";
import { exchangeTokens } from "../exchanges/exchangeTokens";
import { ExchangeResponse, IdentityConfig } from "../exchanges/types";
import { createGetUserByEmail } from "../utils/createGetUserByEmail";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { getGitHubUserWithOauth2Code } from "../utils/getGitHubUserWithOauth2Code";

const logger = getLogger({ service: "identity", filePath: __filename });

function createCreateUserWithOauth2Code(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const createUserWithOauth2Code = async (
    call: { request: CreateUserWithOauth2CodeRequest },
    callback: (error?: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const { request } = call;
    const { code } = request;

    logger.verbose("call to createCreateUserWithOauth2Code");

    const userData = await getGitHubUserWithOauth2Code({
      clientId: identityConfig.githubOauth2Config.clientId,
      clientSecret: identityConfig.githubOauth2Config.clientSecret,
      code
    });

    if (!userData.email) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Failed to get user data from GitHub. This typically happens when your GitHub account doesn't have a public email address"
      });
    }

    const userFromDB = await createGetUserByEmail(prisma)(userData.email);

    if (userFromDB) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: "User already exists"
      });
    }

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        accessKeyId: generateAccessKeyId(AccessKeyIdType.USER),
        emailVerified: true,
        password: customAlphabet("1234567890abcdef", 10)(),
        avatar: userData.avatar_url
      }
    });

    callback(
      null,
      await exchangeTokens(prisma, identityConfig)(user.accessKeyId)
    );
  };

  return withErrorHandlingAndValidation(
    createUserWithOauth2Code,
    V.createUserWithOauth2CodeRequestSchema
  );
}

export { createCreateUserWithOauth2Code };
