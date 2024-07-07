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
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";

const logger = getLogger({ service: "identity", filePath: __filename });

const CreateUserRequestSchema = z.object({
  name: z.string().min(3, "Name must contain at least 3 characters").max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  avatar: z.string().url()
});

type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

type CreateUserResponse = {
  ref: string;
};

function createUser(prisma: Prisma) {
  return async (
    call: { request: CreateUserRequest },
    callback: (error: GrpcErrorMessage, response?: CreateUserResponse) => void
  ) => {
    try {
      const validatedRequest = CreateUserRequestSchema.parse(call.request);

      const { name, email, password, avatar } = validatedRequest;

      logger.verbose("call to createUser", { email });

      const user = await prisma.user.create({
        data: {
          name,
          email,
          accessKeyId: generateAccessKeyId(AccessKeyIdType.USER),
          password,
          avatar
        }
      });

      callback(null, {
        ref: user.ref
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createUser };
