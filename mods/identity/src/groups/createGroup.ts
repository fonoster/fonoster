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
import * as grpc from "@grpc/grpc-js";
import { z } from "zod";
import { Prisma } from "../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

const CreateGroupRequestSchema = z.object({
  name: z.string().min(3, "Name must contain at least 3 characters").max(50)
});

type CreateGroupRequest = z.infer<typeof CreateGroupRequestSchema>;

type CreateGroupResponse = {
  id: string;
};

function createGroup(prisma: Prisma) {
  return async (
    call: { request: CreateGroupRequest },
    callback: (error: GRPCErrors, response?: CreateGroupResponse) => void
  ) => {
    try {
      const validatedRequest = CreateGroupRequestSchema.parse(call.request);

      const token = getTokenFromCall(
        call as unknown as grpc.ServerInterceptingCall
      );
      const ownerId = getUserIdFromToken(token);

      const { name } = validatedRequest;

      logger.verbose("call to createGroup", { name, ownerId });

      const group = await prisma.group.create({
        data: {
          name,
          accessKeyId: generateAccessKeyId(AccessKeyIdType.GROUP),
          ownerId
        }
      });

      callback(null, {
        id: group.id
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createGroup };
