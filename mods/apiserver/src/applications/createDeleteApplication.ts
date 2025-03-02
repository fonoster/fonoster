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
import { BaseApiObject } from "@fonoster/types";
import { Prisma } from "../core/db";
import { createGetFnUtil } from "./createGetFnUtil";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createDeleteApplication(prisma: Prisma) {
  const getFn = createGetFnUtil(prisma);

  const deleteApplication = async (call: {
    request: BaseApiObject;
  }): Promise<BaseApiObject> => {
    const { ref } = call.request;

    logger.verbose("call to deleteApplication", { ref });

    await prisma.application.delete({ where: { ref } });

    return { ref };
  };

  return withErrorHandlingAndValidation(
    withAccess(deleteApplication, (ref: string) => getFn(ref)),
    V.emptySchema
  );
}

export { createDeleteApplication };
