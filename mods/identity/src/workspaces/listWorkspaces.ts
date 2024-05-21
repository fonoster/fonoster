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
import { GRPCError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { TokenUseEnum } from "../exchanges";
import { decodeToken } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

type Workspace = {
  ref: string;
  name: string;
  ownerRef: string;
  createdAt: Date;
  updatedAt: Date;
};

type ListWorkspacesResponse = {
  workspaces: Workspace[];
};

function listWorkspaces(prisma: Prisma) {
  return async (
    call: { request: unknown },
    callback: (error: GRPCError, response?: ListWorkspacesResponse) => void
  ) => {
    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const userRef = getUserRefFromToken(token);
    const access = decodeToken<TokenUseEnum.ACCESS>(token);
    const workspacesAccessKeyIds = access.access?.map((a) => a.accessKeyId);

    logger.verbose("list workspaces for user or apikey", {
      userRef,
      workspacesAccessKeyIds
    });

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          {
            accessKeyId: {
              in: workspacesAccessKeyIds
            }
          },
          {
            members: {
              some: {
                userRef
              }
            }
          },
          {
            ownerRef: userRef
          }
        ]
      }
    });

    if (!workspaces) return [];

    callback(null, { workspaces });
  };
}

export { listWorkspaces };
