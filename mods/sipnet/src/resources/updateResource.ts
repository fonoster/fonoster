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
import { withErrorHandlingAndValidation } from "@fonoster/common";
import { withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { z } from "zod";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function updateResource<T, R, U>(
  api: U,
  resource: string,
  schema: z.ZodSchema
) {
  const fn = async (call: { request: R }): Promise<T> => {
    const { request } = call;

    logger.verbose(`call to update${resource}`, { ...request });

    return await api[`update${resource}`](request);
  };

  return withErrorHandlingAndValidation(
    withAccess(fn, (ref: string) => api[`get${resource}`](ref)),
    schema
  );
}

export { updateResource };
