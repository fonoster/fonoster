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
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

type GetGroupByIdRequest = {
  id: string;
};

type GetGroupByIdResponse = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

function getGroupById(prisma: Prisma) {
  return async (
    call: { request: GetGroupByIdRequest },
    callback: (error: GRPCErrors, response?: GetGroupByIdResponse) => void
  ) => {
    try {
      const { id } = call.request;
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const ownerId = getUserIdFromToken(token);

      logger.verbose("getting group by id", { id, ownerId });

      const group = await prisma.group.findUnique({
        where: {
          id,
          ownerId
        }
      });

      if (!group) {
        callback({ code: GRPCStatus.NOT_FOUND, message: "Group not found" });
        return;
      }

      const response: GetGroupByIdResponse = {
        id: group.id,
        name: group.name,
        ownerId: group.ownerId,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      };

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { getGroupById };
