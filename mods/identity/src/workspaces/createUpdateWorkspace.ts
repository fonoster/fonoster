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
import { createIsAdminMember } from "./createIsAdminMember";

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
    const region = (request as { region?: string }).region;

    logger.verbose("call to updateWorkspace", { ref, userRef });

    // The owner and admins rename a workspace; members only use it.
    const isAdmin = await createIsAdminMember(prisma)(ref, userRef);

    if (!isAdmin) {
      callback({
        code: GRPCStatus.PERMISSION_DENIED,
        message: "Only the workspace owner or an admin can update it"
      });
      return;
    }

    // The region is fixed at creation (add-private-regions PR-1).
    if (region) {
      const current = await prisma.workspace.findUnique({ where: { ref } });
      if (current && current.region !== region) {
        callback({
          code: GRPCStatus.FAILED_PRECONDITION,
          message: "region_immutable: a workspace's region cannot change"
        });
        return;
      }
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
