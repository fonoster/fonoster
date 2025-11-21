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
import { WorkspaceMemberStatus } from "@fonoster/types";
import { Prisma } from "../db";

function createIsWorkspaceMember(prisma: Prisma) {
  return async function isWorkspaceMember(
    workspaceRef: string,
    userRef: string
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: {
        ref: workspaceRef
      }
    });

    const isMember = await prisma.workspaceMember.findFirst({
      where: {
        // Force userId to be an empty string to ensure that the query is not
        // filter by workspaceRef only
        userRef: userRef || "",
        workspaceRef,
        status: WorkspaceMemberStatus.ACTIVE
      }
    });

    const isOwner = workspace?.ownerRef === userRef;

    return !!(isMember || isOwner);
  };
}

export { createIsWorkspaceMember };
