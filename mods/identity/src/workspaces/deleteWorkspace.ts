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
import { GRPCErrors, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

type DeleteWorkspaceRequest = {
  id: string;
};

type DeleteWorkspaceResponse = {
  id: string;
};

function deleteWorkspace(prisma: Prisma) {
  return async (
    call: { request: DeleteWorkspaceRequest },
    callback: (error: GRPCErrors, response?: DeleteWorkspaceResponse) => void
  ) => {
    try {
      const { id } = call.request;

      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const ownerId = getUserIdFromToken(token);

      logger.verbose("deleting workspace by id", { id, ownerId });

      await prisma.workspace.delete({
        where: {
          id,
          ownerId
        }
      });

      const response: DeleteWorkspaceRequest = {
        id
      };

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { deleteWorkspace };
