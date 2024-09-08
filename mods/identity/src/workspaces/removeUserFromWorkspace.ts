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
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  RemoveUserFromWorkspaceRequest,
  RemoveUserFromWorkspaceResponse
} from "@fonoster/types";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { isAdminMember } from "./isAdminMember";
import { Prisma } from "../db";
import { getAccessKeyIdFromCall } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

function removeUserFromWorkspace(prisma: Prisma) {
  const fn = async (
    call: { request: RemoveUserFromWorkspaceRequest },
    callback: (
      error?: GrpcErrorMessage,
      response?: RemoveUserFromWorkspaceResponse
    ) => void
  ) => {
    const { request } = call;
    const { userRef } = request;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );
    const adminRef = getUserRefFromToken(token);
    const workspace = await prisma.workspace.findUnique({
      where: {
        accessKeyId
      }
    });

    const { ref: workspaceRef } = workspace;

    logger.verbose("removing user from workspace", { workspaceRef, userRef });

    const isAdmin = await isAdminMember(prisma)(workspaceRef, adminRef);

    if (!isAdmin && adminRef !== userRef) {
      return callback({
        code: GRPCStatus.PERMISSION_DENIED,
        message: "Only admins or owners can remove users from a workspace"
      });
    }

    const memberRef = await prisma.workspaceMember.findFirst({
      where: {
        workspaceRef,
        userRef
      }
    });

    if (!memberRef) {
      return callback({
        code: GRPCStatus.NOT_FOUND,
        message: "User not found in workspace"
      });
    }

    const response = await prisma.workspaceMember.delete({
      where: {
        ref: memberRef?.ref
      }
    });

    callback(null, response);
  };

  return withErrorHandlingAndValidation(
    fn,
    V.removeUserFromWorkspaceRequestSchema
  );
}

export { removeUserFromWorkspace };
