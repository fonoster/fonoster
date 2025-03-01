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
import * as grpc from "@grpc/grpc-js";
import { Prisma } from "../db";
import { createGetApiKeyByAccessKeyId } from "../utils/createGetApiKeyByAccessKeyId";
import { exchangeTokens } from "./exchangeTokens";
import {
  ExchangeApiKeysRequest,
  ExchangeResponse,
  IdentityConfig
} from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

function createExchangeApiKey(prisma: Prisma, identityConfig: IdentityConfig) {
  const exchangeApiKey = async (
    call: { request: ExchangeApiKeysRequest },
    callback: (error: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const { request } = call;
    const { accessKeyId, accessKeySecret } = request;

    logger.verbose("call to exchangeApiKey", { accessKeyId });

    const key = await createGetApiKeyByAccessKeyId(prisma)(accessKeyId);

    if (key?.accessKeySecret !== accessKeySecret?.trim()) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Invalid credentials"
      });
    }

    callback(null, await exchangeTokens(prisma, identityConfig)(accessKeyId));
  };

  return withErrorHandlingAndValidation(
    exchangeApiKey,
    V.exchangeApiKeysRequestSchema
  );
}

export { createExchangeApiKey };
