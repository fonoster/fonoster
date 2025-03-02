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
  getTokenFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, CreateWorkspaceRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

function createCreateWorkspace(prisma: Prisma) {
  const createWorkspace = async (
    call: { request: CreateWorkspaceRequest },
    callback: (error: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { name } = request;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const ownerRef = getUserRefFromToken(token);
    const accessKeyId = generateAccessKeyId(AccessKeyIdType.WORKSPACE);

    logger.verbose("call to createWorkspace", { name, ownerRef });

    const workspace = await prisma.workspace.create({
      data: {
        name,
        accessKeyId,
        ownerRef
      }
    });

    const { ref } = workspace;

    callback(null, { ref });
  };

  return withErrorHandlingAndValidation(
    createWorkspace,
    V.createWorkspaceRequestSchema
  );
}

export { createCreateWorkspace };
