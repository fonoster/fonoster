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
import { Prisma } from "../db";
import { exchangeTokens } from "../exchanges/exchangeTokens";
import { ExchangeResponse, IdentityConfig } from "../exchanges/types";
import {
  isMethodEnabled,
  isOpenSignup,
  methodDisabledError
} from "../utils/authMethods";
import { createGetUserByEmail } from "../utils/createGetUserByEmail";
import { getGitHubUserWithOauth2Code } from "../utils/getGitHubUserWithOauth2Code";
import { createUserFromGitHub } from "./createUserFromGitHub";

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

    if (
      !isMethodEnabled(identityConfig, "github") ||
      !identityConfig.githubOauth2Config
    ) {
      return callback(methodDisabledError("github"));
    }

    if (!isOpenSignup(identityConfig)) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Sign-up is by invitation only"
      });
    }

    const userData = await getGitHubUserWithOauth2Code({
      clientId: identityConfig.githubOauth2Config.clientId,
      clientSecret: identityConfig.githubOauth2Config.clientSecret,
      url: identityConfig.githubOauth2Config.url,
      apiUrl: identityConfig.githubOauth2Config.apiUrl,
      code
    });

    if (!userData.email) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Your GitHub account has no verified primary email"
      });
    }

    const userFromDB = await createGetUserByEmail(prisma)(userData.email);

    if (userFromDB) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: "User already exists"
      });
    }

    const user = await createUserFromGitHub(prisma)({
      ...userData,
      email: userData.email
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
