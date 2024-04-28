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
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type CreateGroupRequest = {
  name: string;
};

type CreateGroupResponse = {
  id: string;
};

async function createGroup(
  call: { request: CreateGroupRequest },
  callback: (error: Error, response: CreateGroupResponse) => void
) {
  const { name } = call.request;

  logger.verbose("call to createGroup", { name });

  const group = await prisma.group.create({
    data: {
      name,
      accessKeyId: generateAccessKeyId(AccessKeyIdType.GROUP),
      ownerId: "123456"
    }
  });

  callback(null, {
    id: group.id
  });
}

export { createGroup };
