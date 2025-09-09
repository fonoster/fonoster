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
import { Role, WorkspaceMemberStatus } from "@fonoster/types";

/**
 * Human-readable labels for Role enum values.
 */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.USER]: "User",
  [Role.WORKSPACE_OWNER]: "Workspace Owner",
  [Role.WORKSPACE_ADMIN]: "Workspace Admin",
  [Role.WORKSPACE_MEMBER]: "Workspace Member"
};

/**
 * Human-readable labels for WorkspaceMemberStatus enum values.
 */
export const STATUS_LABELS: Record<WorkspaceMemberStatus, string> = {
  [WorkspaceMemberStatus.PENDING]: "Pending",
  [WorkspaceMemberStatus.ACTIVE]: "Active"
};
