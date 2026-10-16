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
import { BaseApiObject, CreateWorkspaceRequest } from "@fonoster/types";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { WorkspaceRegionHooks } from "../exchanges/types";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

const DEFAULT_REGION = "default";

type CreateWorkspaceResponse = BaseApiObject & { region: string };

/**
 * Creates a workspace in one region, for its whole life (add-private-regions PR-1, PR-15): an
 * offered public region id (default `default`) or one of the caller's private regions (by id or
 * ref). Private regions are created at the user level, never here.
 */
function createCreateWorkspace(prisma: Prisma, regions?: WorkspaceRegionHooks) {
  const createWorkspace = async (
    call: { request: CreateWorkspaceRequest },
    callback: (
      error: GrpcErrorMessage,
      response?: CreateWorkspaceResponse
    ) => void
  ) => {
    const { request } = call;
    const { name } = request;
    const requested = (request as { region?: string }).region || undefined;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const ownerRef = getUserRefFromToken(token);
    const accessKeyId = generateAccessKeyId(AccessKeyIdType.WORKSPACE);

    logger.verbose("call to createWorkspace", {
      name,
      ownerRef,
      region: requested
    });

    let region: string;
    if (regions) {
      try {
        region = (await regions.resolveRegion(ownerRef, requested)).region;
      } catch (e) {
        callback({
          code: GRPCStatus.INVALID_ARGUMENT,
          message: (e as Error).message
        });
        return;
      }
    } else {
      region = requested ?? DEFAULT_REGION;
      if (region !== DEFAULT_REGION) {
        callback({
          code: GRPCStatus.INVALID_ARGUMENT,
          message: `region must be ${DEFAULT_REGION}`
        });
        return;
      }
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        accessKeyId,
        ownerRef,
        region
      }
    });

    regions?.workspaceChanged({ accessKeyId, region });

    callback(null, { ref: workspace.ref, region });
  };

  return withErrorHandlingAndValidation(
    createWorkspace,
    V.createWorkspaceRequestSchema
  );
}

export { createCreateWorkspace };
