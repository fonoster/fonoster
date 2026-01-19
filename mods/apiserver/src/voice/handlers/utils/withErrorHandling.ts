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
import { VerbRequest } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { fromError } from "zod-validation-error";

type VerbHandler = (request: VerbRequest) => Promise<void>;

const logger = getLogger({ service: "apiserver", filePath: __filename });

function withErrorHandling(fn: VerbHandler) {
  return async (request: VerbRequest) => {
    try {
      return await fn(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromError(err, {
          prefix: null
        });
        logger.error("Error:", {
          message: validationError.toString()
        });
      } else if (
        err.message !== "Channel not found" &&
        !err.message?.includes("Channel not found")
      ) {
        throw err;
      }
    }
  };
}

export { withErrorHandling };
