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
import {
  roles,
  workspaceResourceAccess,
  workspaceResourceOwnerOrAdminAccess
} from "./roles";
import { Access, RoleType } from "./types";

/** Methods that act inside one workspace, named by the request's accessKeyId. */
const isWorkspaceMethod = (method: string) =>
  workspaceResourceAccess.includes(method) ||
  workspaceResourceOwnerOrAdminAccess.includes(method);

const roleAllows = (roleName: string, method: string) =>
  roles.some(
    (role: RoleType) => role.name === roleName && role.access.includes(method)
  );

/**
 * Whether the token's roles allow the gRPC method. For a workspace method only
 * the caller's role in the target workspace (`targetAccessKeyId`) counts, never
 * a role held in another workspace; without a matching entry it is refused.
 * Malformed claims are refused rather than thrown on.
 */
function hasAccess(
  decodedToken: {
    access?: Access[];
    accessKeyId?: string;
  },
  method: string,
  targetAccessKeyId?: string
): boolean {
  const access = Array.isArray(decodedToken?.access)
    ? decodedToken.access.filter(
        (a) =>
          a && typeof a.role === "string" && typeof a.accessKeyId === "string"
      )
    : [];
  const accessKeyId =
    typeof decodedToken?.accessKeyId === "string"
      ? decodedToken.accessKeyId
      : "";

  if (isWorkspaceMethod(method)) {
    if (!targetAccessKeyId) {
      return false;
    }

    const entry = access.find((a) => a.accessKeyId === targetAccessKeyId);

    return entry ? roleAllows(entry.role, method) : false;
  }

  // User tokens (accessKeyId "US…") always carry the USER role, so methods
  // about the user themselves (e.g. UpdateUser, CreateWorkspace) keep working
  // once they belong to a workspace. Their workspace roles add to it.
  const workspaceRoles = access.map((a) => a.role as string);
  const roleList = accessKeyId.startsWith("US")
    ? [Role.USER as string, ...workspaceRoles]
    : workspaceRoles;

  return roleList.some((r) => roleAllows(r, method));
}

export { hasAccess };
