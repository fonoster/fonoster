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
import { Prisma } from "../db";

const logger = getLogger({ service: "applications", filePath: __filename });

type CreateApplicationRequest = {
  name: string;
};

type CreateApplicationResponse = {
  ref: string;
};

function createApplication(prisma: Prisma) {
  return async (
    call: { request: CreateApplicationRequest },
    callback: (error: GRPCErrors, response?: CreateApplicationResponse) => void
  ) => {
    const { request } = call as { request: { name: string } };

    logger.verbose("call to createApplication", { name: request.name });

    try {
      await prisma.application.create({
        data: {
          name: request.name,
          type: "AUTOPILOT",
          appUrl: "https://example.com"
        }
      });

      return callback(null, { ref: "test-id" });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createApplication };
