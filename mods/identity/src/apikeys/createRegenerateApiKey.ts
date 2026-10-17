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
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, RegenerateApiKeyResponse } from "@fonoster/types";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { createRefreshTokenStore } from "../exchanges/refreshTokens";
import { generateAccessKeySecret } from "../utils/generateAccessKeySecret";
import { isWorkspaceAdminCall } from "../utils/isWorkspaceAdminCall";

const logger = getLogger({ service: "identity", filePath: __filename });

const notAdmin = {
  code: status.PERMISSION_DENIED,
  message: "Only workspace owners and admins can manage API keys"
};

function createRegenerateApiKey(prisma: Prisma) {
  const refreshTokens = createRefreshTokenStore(prisma);

  const regenerateApiKey = async (
    call: { request: BaseApiObject },
    callback: (
      error: GrpcErrorMessage,
      response?: RegenerateApiKeyResponse
    ) => void
  ) => {
    const { request } = call;
    const { ref } = request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.info("regenerating ApiKey", { ref, accessKeyId });

    if (!isWorkspaceAdminCall(call)) {
      return callback(notAdmin);
    }

    // Only a key of the caller's workspace; others look like they don't exist.
    const key = await prisma.apiKey.findFirst({
      where: { ref, workspace: { accessKeyId } }
    });

    if (!key) {
      return callback({ code: status.NOT_FOUND, message: "ApiKey not found" });
    }

    const response = await prisma.apiKey.update({
      where: {
        ref: key.ref
      },
      data: {
        accessKeySecret: generateAccessKeySecret()
      }
    });

    // The old secret's sessions end with it.
    await refreshTokens.revokeAll(key.accessKeyId);

    callback(null, {
      ref: response.ref,
      accessKeyId: response.accessKeyId,
      accessKeySecret: response.accessKeySecret
    });
  };

  return withErrorHandlingAndValidation(regenerateApiKey, V.emptySchema);
}

export { createRegenerateApiKey };
