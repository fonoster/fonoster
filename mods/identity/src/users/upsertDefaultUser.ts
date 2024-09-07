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
import { prisma } from "../db";

const logger = getLogger({ service: "identity", filePath: __filename });

const createUserRequestSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(50).or(z.string().optional().nullable())
});

type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

const USER_REF = "00000000-0000-0000-0000-000000000000";
const WORKSPACE_REF = "00000000-0000-0000-0000-000000000000";
const USER_ACCESS_KEY_ID = "US00000000000000000000000000000000";
const WORKSPACE_ACCESS_KEY_ID = "WO00000000000000000000000000000000";

async function upsertDefaultUser(request: CreateUserRequest) {
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
    logger.error("error on upsertDefaultUser", { error });
    process.exit(1);
  }
}

export { upsertDefaultUser };
