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
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function getResource<T, R, U>(api: U, resource: string) {
  const fn = async (call: { request: R }): Promise<T> => {
    const { request } = call as { request: { ref: string } };

    logger.verbose(`call to get${resource}`, { request, resource });

    return await api[`get${resource}`](request.ref);
  };

  return withErrorHandlingAndValidation(
    withAccess(fn, (ref: string) => api[`get${resource}`](ref)),
    V.emptySchema
  );
}

export { getResource };
