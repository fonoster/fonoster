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
import { Validators as V } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, Secret } from "@fonoster/types";
import { Prisma } from "../core/db";
import { withErrorHandlingAndValidationAndAccess } from "../utils/withErrorHandlingAndValidationAndAccess";
import { createGetFnUtil } from "./createGetFnUtil";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function getSecret(prisma: Prisma) {
  const getFn = createGetFnUtil(prisma);

  const fn = async (call: { request: BaseApiObject }): Promise<Secret> => {
    const { ref } = call.request;

    logger.verbose("call to getSecret", { ref });

    return await getFn(ref);
  };

  return withErrorHandlingAndValidationAndAccess(
    fn,
    (ref: string) => getFn(ref),
    V.emptySchema
  );
}

export { getSecret };
