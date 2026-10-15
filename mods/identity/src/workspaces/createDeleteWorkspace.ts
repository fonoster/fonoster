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
  getTokenFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { WorkspaceRegionHooks } from "../exchanges/types";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

function createDeleteWorkspace(prisma: Prisma, regions?: WorkspaceRegionHooks) {
  const deleteWorkspace = async (
    call: { request: BaseApiObject },
    callback: (error: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { ref } = request;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const ownerRef = getUserRefFromToken(token);

    logger.verbose("deleting workspace from the system", { ref, ownerRef });

    const deleted = await prisma.workspace.delete({
      where: {
        ref,
        ownerRef
      }
    });

    // Deleting the workspace revokes its private region (PR-2).
    if (deleted?.region?.startsWith("rg_"))
      await regions
        ?.deleteRegion({ accessKeyId: deleted.accessKeyId })
        .catch((e) =>
          logger.error("could not retire the workspace's region", {
            ref,
            error: (e as Error).message
          })
        );

    callback(null, { ref });
  };

  return withErrorHandlingAndValidation(deleteWorkspace, V.emptySchema);
}

export { createDeleteWorkspace };
