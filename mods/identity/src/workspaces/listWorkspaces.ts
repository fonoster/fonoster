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
import { ListWorkspacesResponse } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { TokenUseEnum } from "../exchanges";
import { decodeToken } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

function listWorkspaces(prisma: Prisma) {
  const fn = async (
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
      items,
      nextPageToken: items[items.length - 1]?.ref
    });
  };

  return withErrorHandlingAndValidation(fn, V.listRequestSchema);
}

export { listWorkspaces };
