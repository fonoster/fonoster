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
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { Prisma } from "../db";
import { GRPCErrors } from "../errors";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type ListGroupsRequest = unknown;

type Group = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type ListGroupsResponse = {
  groups: Group[];
};

function listGroups(prisma: Prisma) {
  return async (
    call: { request: ListGroupsRequest },
    callback: (error: GRPCErrors, response?: ListGroupsResponse) => void
  ) => {
    const token = getTokenFromCall(
      call as unknown as grpc.ServerInterceptingCall
    );
    const userId = getUserIdFromToken(token);

    logger.verbose("list groups for user", { userId });

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          {
            members: {
              some: {
                userId: userId
              }
            }
          },
          {
            ownerId: userId
          }
        ]
      }
    });

    if (!groups) return [];

    callback(null, { groups });
  };
}

export { listGroups };
