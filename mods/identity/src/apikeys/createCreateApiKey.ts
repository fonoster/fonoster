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
import { CreateApiKeyRequest, CreateApiKeyResponse } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { generateAccessKeySecret } from "../utils/generateAccessKeySecret";

const logger = getLogger({ service: "identity", filePath: __filename });

function createCreateApiKey(prisma: Prisma) {
  const createApiKey = async (
    call: { request: CreateApiKeyRequest },
    callback: (error: GrpcErrorMessage, response?: CreateApiKeyResponse) => void
  ) => {
    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    const { request } = call;
    const { role, expiresAt } = request;

    logger.info("creating new ApiKey", { accessKeyId, role, expiresAt });

    const workspace = await prisma.workspace.findUnique({
      where: { accessKeyId }
    });

    const { ref } = workspace;

    const response = await prisma.apiKey.create({
      data: {
        workspaceRef: ref,
        role,
        accessKeyId: generateAccessKeyId(AccessKeyIdType.API_KEY),
        accessKeySecret: generateAccessKeySecret(),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    callback(null, {
      ref: response.ref,
      accessKeyId: response.accessKeyId,
      accessKeySecret: response.accessKeySecret
    });
  };

  return withErrorHandlingAndValidation(
    createApiKey,
    V.createApiKeyRequestSchema
  );
}

export { CreateApiKeyRequest, CreateApiKeyResponse, createCreateApiKey };
