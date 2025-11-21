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
import { ROLE_LABELS } from "~/workspaces/pages/[workspace]/members/members.constants";

export const ROLE_OPTIONS = [
  {
    label: ROLE_LABELS[Role.WORKSPACE_ADMIN],
    value: Role.WORKSPACE_ADMIN
  },
  {
    label: ROLE_LABELS[Role.WORKSPACE_MEMBER],
    value: Role.WORKSPACE_MEMBER
  }
];
