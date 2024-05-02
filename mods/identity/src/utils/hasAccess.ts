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
import { Access, Role } from "../exchanges";
import roles from "../roles";

// This method only checks if the role has access to the path
function hasAccess(access: Access[], grpcPath: string) {
  const roleList = access.map((a: Access) => a.role);

  return roleList.some((r: string) => {
    return roles.find(
      (role: Role) => role.name === r && role.access.includes(grpcPath)
    );
  });
}

export { hasAccess };
