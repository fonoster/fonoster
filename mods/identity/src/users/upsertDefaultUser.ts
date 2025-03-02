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
import { getLogger } from "@fonoster/logger";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { createPrismaClient } from "../db";
import { IdentityConfig } from "../exchanges";

const logger = getLogger({ service: "identity", filePath: __filename });

const createUserRequestSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name must be at most 50 characters long" }),
  email: z.string().email({ message: "Must be a valid email" }),
  password: z.string().min(8).max(50).or(z.string().optional().nullable())
});

type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

const USER_REF = "00000000-0000-0000-0000-000000000000";
const WORKSPACE_REF = "00000000-0000-0000-0000-000000000000";
const USER_ACCESS_KEY_ID = "US00000000000000000000000000000000";
const WORKSPACE_ACCESS_KEY_ID = "WO00000000000000000000000000000000";

async function upsertDefaultUser(
  identityConfig: IdentityConfig,
  request: CreateUserRequest
) {
  const prisma = createPrismaClient(
    identityConfig.dbUrl,
    identityConfig.encryptionKey
  );

  try {
    const validatedRequest = createUserRequestSchema.parse(request);

    const { name, email, password } = validatedRequest;

    logger.verbose("call to upsertDefaultUser", {
      email,
      accessKeyId: USER_ACCESS_KEY_ID
    });

    await prisma.user.upsert({
      where: { ref: USER_REF },
      update: {
        name,
        email,
        password: password || undefined,
        accessKeyId: USER_ACCESS_KEY_ID,
        updatedAt: new Date()
      },
      create: {
        ref: USER_REF,
        name,
        email,
        password,
        accessKeyId: USER_ACCESS_KEY_ID
      }
    });

    await prisma.workspace.upsert({
      where: { ref: WORKSPACE_REF },
      update: {},
      create: {
        ref: WORKSPACE_REF,
        name: "Default Workspace",
        ownerRef: USER_REF,
        accessKeyId: WORKSPACE_ACCESS_KEY_ID
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("validation error on upsertDefaultUser", {
        error: fromError(error, { prefix: null }).toString()
      });
    } else {
      logger.error("error on upsertDefaultUser", { error });
    }
    process.exit(1);
  }
}

export { upsertDefaultUser };
