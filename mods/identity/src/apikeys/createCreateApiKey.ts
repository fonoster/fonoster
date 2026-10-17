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
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { generateAccessKeySecret } from "../utils/generateAccessKeySecret";
import { isWorkspaceAdminCall } from "../utils/isWorkspaceAdminCall";

const logger = getLogger({ service: "identity", filePath: __filename });

const notAdmin = {
  code: status.PERMISSION_DENIED,
  message: "Only workspace owners and admins can manage API keys"
};

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

    // Keys act as WORKSPACE_ADMIN, so only owners and admins may mint them.
    if (!isWorkspaceAdminCall(call)) {
      return callback(notAdmin);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { accessKeyId }
    });

    if (!workspace) {
      return callback({
        code: status.NOT_FOUND,
        message: "Workspace not found"
      });
    }

    const { ref } = workspace;

    const response = await prisma.apiKey.create({
      data: {
        workspaceRef: ref,
        role,
        accessKeyId: generateAccessKeyId(AccessKeyIdType.API_KEY),
        accessKeySecret: generateAccessKeySecret(),
        // expiresAt arrives as epoch seconds (the wire field is int32, which
        // can't hold epoch milliseconds).
        expiresAt: expiresAt ? new Date(expiresAt * 1000) : null
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
