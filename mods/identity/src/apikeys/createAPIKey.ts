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
import { z } from "zod";
import { ApiRoleEnum } from "./ApiRoleEnum";
import { Prisma } from "../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { generateAccessKeySecret } from "../utils/generateAccessKeySecret";

const logger = getLogger({ service: "identity", filePath: __filename });

const CreatApiKeyRequestSchema = z.object({
  workspaceRef: z.string(),
  role: z.enum([ApiRoleEnum.WORKSPACE_ADMIN]),
  expiresAt: z.number().transform((value) => (value === 0 ? null : value))
});

type CreateApiKeyRequest = z.infer<typeof CreatApiKeyRequestSchema>;

type CreateApiKeyResponse = {
  ref: string;
};

function createApiKey(prisma: Prisma) {
  return async (
    call: { request: CreateApiKeyRequest },
    callback: (error: GRPCErrors, response?: CreateApiKeyResponse) => void
  ) => {
    try {
      const validatedRequest = CreatApiKeyRequestSchema.parse(call.request);

      const { workspaceRef, role, expiresAt } = validatedRequest;

      logger.info("creating new ApiKey", { workspaceRef, role, expiresAt });

      const response = await prisma.apiKey.create({
        data: {
          workspaceRef: validatedRequest.workspaceRef,
          role: validatedRequest.role,
          accessKeyId: generateAccessKeyId(AccessKeyIdType.API_KEY),
          accessKeySecret: generateAccessKeySecret(),
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });

      callback(null, { ref: response.ref });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createApiKey };
