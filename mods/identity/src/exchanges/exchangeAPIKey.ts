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
import { GRPCErrors, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { z } from "zod";
import { exchangeTokens } from "./exchangeTokens";
import { IdentityConfig } from "./types";
import { Prisma } from "../db";
import { getAPIKeyByAccessKeyId } from "../utils/getAPIKeyByAccessKeyId";

const logger = getLogger({ service: "identity", filePath: __filename });

const ExchangeAPIKeysRequestSchema = z.object({
  accessKeyId: z.string(),
  accessKeySecret: z.string()
});

type ExchangeAPIKeysRequest = z.infer<typeof ExchangeAPIKeysRequestSchema>;

type ExchangeAPIKeysResponse = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

const invalidAPIKeyError = {
  code: grpc.status.PERMISSION_DENIED,
  message: "Invalid credentials"
};

function exchangeAPIKey(prisma: Prisma, identityConfig: IdentityConfig) {
  return async (
    call: { request: ExchangeAPIKeysRequest },
    callback: (error: GRPCErrors, response?: ExchangeAPIKeysResponse) => void
  ) => {
    try {
      const validatedRequest = ExchangeAPIKeysRequestSchema.parse(call.request);
      const { accessKeyId, accessKeySecret } = validatedRequest;

      logger.verbose("call to exchangeAPIKey", { accessKeyId });

      const key = await getAPIKeyByAccessKeyId(prisma)(accessKeyId);

      if (!key || key.accessKeySecret !== accessKeySecret?.trim()) {
        return callback(invalidAPIKeyError);
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

export { exchangeAPIKey };
