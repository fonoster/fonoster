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
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { APIRoleEnum } from "./APIRoleEnum";
import { Prisma } from "../../db";
import { GRPCErrors, handleError } from "../../errors";
import { generateAccessKeySecret } from "../utils/generateAccessKeySecret";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const RegenerateAPIKeyRequestSchema = z.object({
  id: z.string()
});

type RegenerateAPIKeyRequest = z.infer<typeof RegenerateAPIKeyRequestSchema>;

type RegenerateAPIKeyResponse = {
  id: string;
  accessKeyId: string;
  accessKeySecret: string;
  role: APIRoleEnum;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function regenerateAPIKey(prisma: Prisma) {
  return async (
    call: { request: RegenerateAPIKeyRequest },
    callback: (error: GRPCErrors, response?: RegenerateAPIKeyResponse) => void
  ) => {
    try {
      const validatedRequest = RegenerateAPIKeyRequestSchema.parse(
        call.request
      );

      const { id } = validatedRequest;

      logger.info("regenerating API Key", { id });

      const response = await prisma.aPIKey.update({
        where: {
          id
        },
        data: {
          accessKeySecret: generateAccessKeySecret()
        }
      });

      callback(null, {
        id: response.id,
        accessKeyId: response.accessKeyId,
        accessKeySecret: response.accessKeySecret,
        role: response.role as APIRoleEnum,
        expiresAt: response.expiresAt,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { regenerateAPIKey };
