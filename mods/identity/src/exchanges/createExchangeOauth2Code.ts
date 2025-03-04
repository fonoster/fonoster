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
  exchangeOauth2RequestSchema,
  GrpcErrorMessage,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { Prisma } from "../db";
import { createGetUserByEmail } from "../utils/createGetUserByEmail";
import { getGitHubUserWithOauth2Code } from "../utils/getGitHubUserWithOauth2Code";
import { exchangeTokens } from "./exchangeTokens";
import {
  ExchangeOauth2CodeRequest,
  ExchangeResponse,
  IdentityConfig
} from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

function createExchangeOauth2Code(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const exchangeOauth2Code = async (
    call: { request: ExchangeOauth2CodeRequest },
    callback: (error?: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const { request } = call;
    const { provider, code } = request;

    logger.verbose("call to exchangeOauth2Code", { provider });

    const userData = await getGitHubUserWithOauth2Code({
      clientId: identityConfig.githubOauth2Config.clientId,
      clientSecret: identityConfig.githubOauth2Config.clientSecret,
      code
    });

    const user = await createGetUserByEmail(prisma)(userData.email);

    if (!user) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Invalid credentials"
      });
    }

    callback(
      null,
      await exchangeTokens(prisma, identityConfig)(user.accessKeyId)
    );
  };

  return withErrorHandlingAndValidation(
    exchangeOauth2Code,
    exchangeOauth2RequestSchema
  );
}

export { createExchangeOauth2Code };
