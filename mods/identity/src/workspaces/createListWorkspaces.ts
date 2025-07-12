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
  decodeToken,
  getTokenFromCall,
  GrpcErrorMessage,
  TokenUseEnum,
  Validators as V,
  withErrorHandlingAndValidation,
  datesMapper
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ListWorkspacesResponse } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

function createListWorkspaces(prisma: Prisma) {
  const listWorkspaces = async (
    call: { request: unknown },
    callback: (
      error?: GrpcErrorMessage,
      response?: ListWorkspacesResponse
    ) => void
  ) => {
    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const userRef = getUserRefFromToken(token);
    const access = decodeToken<TokenUseEnum.ACCESS>(token);
    const workspacesAccessKeyIds = access.access?.map((a) => a.accessKeyId);

    logger.verbose("list workspaces for user or apikey", {
      userRef,
      workspacesAccessKeyIds
    });

    const items = await prisma.workspace.findMany({
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

    callback(null, {
      items: items.map(datesMapper),
      nextPageToken: items[items.length - 1]?.ref
    });
  };

  return withErrorHandlingAndValidation(listWorkspaces, V.listRequestSchema);
}

export { createListWorkspaces };
