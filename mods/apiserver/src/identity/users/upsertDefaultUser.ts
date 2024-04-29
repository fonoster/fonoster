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
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { Prisma } from "../../db";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const CreateUserRequestSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(50).or(z.string().optional().nullable()),
  accessKeyId: z.string().min(32).max(32).or(z.string().optional().nullable())
});

type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

function upsertDefaultUser(prisma: Prisma) {
  return async (request: CreateUserRequest) => {
    try {
      const validatedRequest = CreateUserRequestSchema.parse(request);

      const { id, name, email, password, accessKeyId } = validatedRequest;

      const hereAccessKeyId =
        accessKeyId || generateAccessKeyId(AccessKeyIdType.USER);

      logger.verbose("call to upsertDefaultUser", { email, accessKeyId });

      return await prisma.user.upsert({
        where: { id },
        update: {
          name,
          email,
          password: password || undefined,
          accessKeyId: hereAccessKeyId,
          updatedAt: new Date()
        },
        create: {
          id,
          name,
          email,
          password,
          accessKeyId: hereAccessKeyId
        }
      });
    } catch (error) {
      logger.error("error on upsertDefaultUser", { error });
      process.exit(1);
    }
  };
}

export { upsertDefaultUser };
