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
import { APIRoleEnum } from "./APIRoleEnum";
import { Prisma } from "../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { generateAccessKeySecret } from "../utils/generateAccessKeySecret";

const logger = getLogger({ service: "identity", filePath: __filename });

const CreateAPIKeyRequestSchema = z.object({
  workspaceRef: z.string(),
  role: z.enum([APIRoleEnum.WORKSPACE_ADMIN]),
  expiresAt: z.number().transform((value) => (value === 0 ? null : value))
});

type CreateAPIKeyRequest = z.infer<typeof CreateAPIKeyRequestSchema>;

type CreateAPIKeyResponse = {
  ref: string;
};

function createAPIKey(prisma: Prisma) {
  return async (
    call: { request: CreateAPIKeyRequest },
    callback: (error: GRPCErrors, response?: CreateAPIKeyResponse) => void
  ) => {
    try {
      const validatedRequest = CreateAPIKeyRequestSchema.parse(call.request);

      const { workspaceRef, role, expiresAt } = validatedRequest;

      logger.info("creating new APIKey", { workspaceRef, role, expiresAt });

      const response = await prisma.aPIKey.create({
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

export { createAPIKey };
