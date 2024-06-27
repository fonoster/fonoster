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
import { GRPCErrorMessage, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { z } from "zod";
import { isWorkspaceMember } from "./isWorkspaceMember";
import { Prisma } from "../db";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

const UpdateWorkspaceRequestSchema = z.object({
  ref: z.string(),
  name: z.string().min(3).max(50).or(z.string().optional().nullable())
});

type UpdateWorkspaceRequest = z.infer<typeof UpdateWorkspaceRequestSchema>;

type UpdateWorkspaceResponse = {
  ref: string;
};

function updateWorkspace(prisma: Prisma) {
  return async (
    call: { request: UpdateWorkspaceRequest },
    callback: (
      error: GRPCErrorMessage,
      response?: UpdateWorkspaceResponse
    ) => void
  ) => {
    try {
      const validatedRequest = UpdateWorkspaceRequestSchema.parse(call.request);
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const userRef = getUserRefFromToken(token);
      const { ref, name } = validatedRequest;

      logger.verbose("call to updateWorkspace", { ref, userRef });

      const isMember = await isWorkspaceMember(prisma)(ref, userRef);

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

      const response: UpdateWorkspaceResponse = {
        ref
      };

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { updateWorkspace };
