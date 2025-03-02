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
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, RegenerateApiKeyResponse } from "@fonoster/types";
import { Prisma } from "../db";
import { generateAccessKeySecret } from "../utils/generateAccessKeySecret";

const logger = getLogger({ service: "identity", filePath: __filename });

function createRegenerateApiKey(prisma: Prisma) {
  const regenerateApiKey = async (
    call: { request: BaseApiObject },
    callback: (
      error: GrpcErrorMessage,
      response?: RegenerateApiKeyResponse
    ) => void
  ) => {
    const { request } = call;
    const { ref } = request;

    logger.info("regenerating ApiKey", { ref });

    const response = await prisma.apiKey.update({
      where: {
        ref
      },
      data: {
        accessKeySecret: generateAccessKeySecret()
      }
    });

    callback(null, {
      ref: response.ref,
      accessKeyId: response.accessKeyId,
      accessKeySecret: response.accessKeySecret
    });
  };

  return withErrorHandlingAndValidation(regenerateApiKey, V.emptySchema);
}

export { createRegenerateApiKey };
