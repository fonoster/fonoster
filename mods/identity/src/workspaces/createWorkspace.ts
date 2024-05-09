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
import { z } from "zod";
import { Prisma } from "../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

const CreateWorkspaceRequestSchema = z.object({
  name: z.string().min(3, "Name must contain at least 3 characters").max(50)
});

type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceRequestSchema>;

type CreateWorkspaceResponse = {
  ref: string;
};

function createWorkspace(prisma: Prisma) {
  return async (
    call: { request: CreateWorkspaceRequest },
    callback: (error: GRPCErrors, response?: CreateWorkspaceResponse) => void
  ) => {
    try {
      const validatedRequest = CreateWorkspaceRequestSchema.parse(call.request);

      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const ownerRef = getUserIdFromToken(token);

      const { name } = validatedRequest;

      logger.verbose("call to createWorkspace", { name, ownerRef });

      const workspace = await prisma.workspace.create({
        data: {
          name,
          accessKeyId: generateAccessKeyId(AccessKeyIdType.WORKSPACE),
          ownerRef
        }
      });

      callback(null, {
        ref: workspace.ref
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createWorkspace };
