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
import { Prisma } from "../../db";

function isGroupMember(prisma: Prisma) {
  return async (groupId: string, userId: string) => {
    const group = await prisma.group.findUnique({
      where: {
        id: groupId
      }
    });

    const isMember = await prisma.groupMember.findFirst({
      where: {
        // Force userId to be an empty string to ensure that the query is not
        // fillter by groupId only
        userId: userId || "",
        groupId
      }
    });

    const isOwner = group?.ownerId === userId;

    return !!(isMember || isOwner);
  };
}

export { isGroupMember };
