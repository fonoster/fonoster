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
import { GRPCErrors } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { Prisma } from "../db";
import { Access } from "../exchanges";
import { decodeToken } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

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
    const access = decodeToken(token) as { access: Access[] };
    const groupsAccessKeyIds = access.access?.map((a) => a.accessKeyId);

    logger.verbose("list groups for user or apikey", {
      userId,
      groupsAccessKeyIds
    });

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          {
            accessKeyId: {
              in: groupsAccessKeyIds
            }
          },
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
