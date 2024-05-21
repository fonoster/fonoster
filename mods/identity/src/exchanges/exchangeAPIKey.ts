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
import { GRPCError, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { z } from "zod";
import { exchangeTokens } from "./exchangeTokens";
import { IdentityConfig } from "./types";
import { Prisma } from "../db";
import { getApiKeyByAccessKeyId } from "../utils/getApiKeyByAccessKeyId";

const logger = getLogger({ service: "identity", filePath: __filename });

const ExchangeApiKeysRequestSchema = z.object({
  accessKeyId: z.string(),
  accessKeySecret: z.string()
});

type ExchangeApiKeysRequest = z.infer<typeof ExchangeApiKeysRequestSchema>;

type ExchangeApiKeysResponse = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

const invalidApiKeyError = {
  code: grpc.status.PERMISSION_DENIED,
  message: "Invalid credentials"
};

function exchangeApiKey(prisma: Prisma, identityConfig: IdentityConfig) {
  return async (
    call: { request: ExchangeApiKeysRequest },
    callback: (error: GRPCError, response?: ExchangeApiKeysResponse) => void
  ) => {
    try {
      const validatedRequest = ExchangeApiKeysRequestSchema.parse(call.request);
      const { accessKeyId, accessKeySecret } = validatedRequest;

      logger.verbose("call to exchangeApiKey", { accessKeyId });

      const key = await getApiKeyByAccessKeyId(prisma)(accessKeyId);

      if (key?.accessKeySecret !== accessKeySecret?.trim()) {
        return callback(invalidApiKeyError);
      }

      return callback(
        null,
        await exchangeTokens(prisma, identityConfig)(accessKeyId)
      );
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { exchangeApiKey };
