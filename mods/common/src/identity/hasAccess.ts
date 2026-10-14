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
import { Role } from "@fonoster/types";
import { roles } from "./roles";
import { Access, RoleType } from "./types";

// This function only checks if the role has access to the grpc method
function hasAccess(
  decodedToken: {
    access: Access[];
    accessKeyId: string;
  },
  method: string
) {
  const { access, accessKeyId } = decodedToken;
  const workspaceRoles = access.map((a: Access) => a.role);
  // User tokens (accessKeyId "US…") always carry the USER role, so methods
  // about the user themselves (e.g. UpdateUser, CreateWorkspace) keep working
  // once they belong to a workspace. Their workspace roles add to it.
  const roleList = accessKeyId.startsWith("US")
    ? [Role.USER, ...workspaceRoles]
    : workspaceRoles;

  return roleList.some((r: string) =>
    roles.find(
      (role: RoleType) => role.name === r && role.access.includes(method)
    )
  );
}

export { hasAccess };
