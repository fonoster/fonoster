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
import { BaseApiObject, UpdateWorkspaceRequest } from "@fonoster/types";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";
import { createIsWorkspaceMember } from "./createIsWorkspaceMember";

const logger = getLogger({ service: "identity", filePath: __filename });

function createUpdateWorkspace(prisma: Prisma) {
  const updateWorkspace = async (
    call: { request: UpdateWorkspaceRequest },
    callback: (error: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const userRef = getUserRefFromToken(token);

    const { request } = call;
    const { ref, name } = request;

    logger.verbose("call to updateWorkspace", { ref, userRef });

    const isMember = await createIsWorkspaceMember(prisma)(ref, userRef);

    if (!isMember) {
      callback({
        code: GRPCStatus.PERMISSION_DENIED,
        message: "User is not a member of the workspace"
      });
    }

    await prisma.workspace.update({
      where: {
        ref
      },
      data: {
        name
      }
    });

    callback(null, { ref });
  };

  return withErrorHandlingAndValidation(
    updateWorkspace,
    V.updateWorkspaceRequestSchema
  );
}

export { createUpdateWorkspace };
