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

const DEFAULT_REGION = "us-east-1";
const PRIVATE_REGION = "private";

type CreateWorkspaceResponse = BaseApiObject & {
  region: string;
  enrollmentToken?: string;
  expiresAt?: string;
};

/**
 * Creates a workspace in one region, for its whole life (add-private-regions PR-1): a public
 * region id, or "private" to create the workspace's own private region with it (PR-2), whose
 * one-time enrollment token is returned here only.
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
    const requested =
      (request as { region?: string }).region ||
      regions?.defaultRegion ||
      DEFAULT_REGION;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const ownerRef = getUserRefFromToken(token);
    const accessKeyId = generateAccessKeyId(AccessKeyIdType.WORKSPACE);

    logger.verbose("call to createWorkspace", {
      name,
      ownerRef,
      region: requested
    });

    const publicRegions = regions?.publicRegions ?? [DEFAULT_REGION];
    if (requested !== PRIVATE_REGION && !publicRegions.includes(requested)) {
      callback({
        code: GRPCStatus.INVALID_ARGUMENT,
        message: `region must be one of ${[...publicRegions, PRIVATE_REGION].join(", ")}`
      });
      return;
    }

    let region = requested;
    let enrollment: { enrollmentToken: string; expiresAt: string } | undefined;
    if (requested === PRIVATE_REGION) {
      if (!regions) {
        callback({
          code: GRPCStatus.FAILED_PRECONDITION,
          message: "private regions are not available on this server"
        });
        return;
      }
      const created = await regions.createPrivateRegion({ accessKeyId });
      region = created.regionRef;
      enrollment = {
        enrollmentToken: created.enrollmentToken,
        expiresAt: created.expiresAt
      };
    }

    let workspace;
    try {
      workspace = await prisma.workspace.create({
        data: {
          name,
          accessKeyId,
          ownerRef,
          region
        }
      });
    } catch (e) {
      if (enrollment) await regions?.deleteRegion({ accessKeyId });
      throw e;
    }

    const { ref } = workspace;

    callback(null, { ref, region, ...(enrollment ?? {}) });
  };

  return withErrorHandlingAndValidation(
    createWorkspace,
    V.createWorkspaceRequestSchema
  );
}

export { createCreateWorkspace };
