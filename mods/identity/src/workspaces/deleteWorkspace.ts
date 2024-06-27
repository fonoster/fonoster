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
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

type DeleteWorkspaceRequest = {
  ref: string;
};

type DeleteWorkspaceResponse = {
  ref: string;
};

function deleteWorkspace(prisma: Prisma) {
  return async (
    call: { request: DeleteWorkspaceRequest },
    callback: (error: GRPCErrorMessage, response?: DeleteWorkspaceResponse) => void
  ) => {
    try {
      const { ref } = call.request;

      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const ownerRef = getUserRefFromToken(token);

      logger.verbose("deleting workspace from the system", { ref, ownerRef });

      await prisma.workspace.delete({
        where: {
          ref,
          ownerRef
        }
      });

      const response: DeleteWorkspaceRequest = {
        ref
      };

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { deleteWorkspace };
