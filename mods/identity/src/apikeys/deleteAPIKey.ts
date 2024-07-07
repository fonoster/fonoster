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
import { GrpcErrorMessage, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { Prisma } from "../db";

const logger = getLogger({ service: "identity", filePath: __filename });

const DeleteApiKeyRequestSchema = z.object({
  ref: z.string()
});

type DeleteApiKeyRequest = z.infer<typeof DeleteApiKeyRequestSchema>;

type DeleteApiKeyResponse = {
  ref: string;
};

function deleteApiKey(prisma: Prisma) {
  return async (
    call: { request: DeleteApiKeyRequest },
    callback: (error: GrpcErrorMessage, response?: DeleteApiKeyResponse) => void
  ) => {
    try {
      const validatedRequest = DeleteApiKeyRequestSchema.parse(call.request);

      const { ref } = validatedRequest;

      logger.info("deleting ApiKey", { ref });

      const response = await prisma.apiKey.delete({
        where: {
          ref
        }
      });

      callback(null, {
        ref: response.ref
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { deleteApiKey };
