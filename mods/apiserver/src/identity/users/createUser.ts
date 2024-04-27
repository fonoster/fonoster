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
import { prisma } from "../../db";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  avatar: string;
};

type CreateUserResponse = {
  id: string;
};

async function createUser(
  call: { request: CreateUserRequest },
  callback: (error: Error, response: CreateUserResponse) => void
) {
  const { name, email, password, avatar } = call.request;

  logger.verbose("call to createUser", { email });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      avatar
    }
  });

  callback(null, {
    id: user.id
  });
}

export { createUser };
