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
  GrpcErrorMessage,
  withErrorHandling,
  withValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { z } from "zod";
import { exchangeTokens } from "./exchangeTokens";
import { IdentityConfig } from "./types";
import { Prisma } from "../db";
import { getUserByEmail } from "../utils/getUserByEmail";

const logger = getLogger({ service: "identity", filePath: __filename });

const exchangeCredentialsRequestSchema = z.object({
  username: z.string(),
  password: z.string()
});

type ExchangeCredentialsRequest = z.infer<
  typeof exchangeCredentialsRequestSchema
>;

type ExchangeCredentialsResponse = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

const invalidCredentialsError = {
  code: grpc.status.PERMISSION_DENIED,
  message: "Invalid credentials"
};

function exchangeCredentials(prisma: Prisma, identityConfig: IdentityConfig) {
  const fn = async (
    call: { request: ExchangeCredentialsRequest },
    callback: (
      error: GrpcErrorMessage,
      response?: ExchangeCredentialsResponse
    ) => void
  ) => {
    const { request } = call;
    const { username, password } = request;

    logger.verbose("call to exchangeCredentials", { username });

    const user = await getUserByEmail(prisma)(username);

    if (!user || user.password !== password?.trim()) {
      return callback(invalidCredentialsError);
    }

    callback(
      null,
      await exchangeTokens(prisma, identityConfig)(user.accessKeyId)
    );
  };

  return withErrorHandling(
    withValidation(fn, exchangeCredentialsRequestSchema)
  );
}

export { exchangeCredentials };
