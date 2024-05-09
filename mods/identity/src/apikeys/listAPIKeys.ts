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
import { GRPCErrors } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { APIRoleEnum } from "./APIRoleEnum";
import { Prisma } from "../db";

const logger = getLogger({ service: "identity", filePath: __filename });

const ListAPIKeysRequestSchema = z.object({
  workspaceRef: z.string()
});

type ListAPIKeysRequest = z.infer<typeof ListAPIKeysRequestSchema>;

type APIKey = {
  ref: string;
  accessKeyId: string;
  role: APIRoleEnum;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ListAPIKeysResponse = {
  apiKeys: APIKey[];
};

function listAPIKeys(prisma: Prisma) {
  return async (
    call: { request: ListAPIKeysRequest },
    callback: (error: GRPCErrors, response?: ListAPIKeysResponse) => void
  ) => {
    const validatedRequest = ListAPIKeysRequestSchema.parse(call.request);

    const { workspaceRef } = validatedRequest;

    logger.verbose("list keys for workspace", { workspaceRef });

    const apiKeys = await prisma.aPIKey.findMany({
      where: {
        workspaceRef
      }
    });

    if (!apiKeys) return [];

    callback(null, { apiKeys } as ListAPIKeysResponse);
  };
}

export { listAPIKeys };
