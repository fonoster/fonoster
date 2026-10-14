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
import type { Workspace } from "@fonoster/types";

/** A workspace owned by fakeAuth()'s user (u1). */
export const testWorkspace: Workspace = {
  ref: "ws-1",
  name: "Acme Support",
  ownerRef: "u1",
  accessKeyId: "WOacme000000000000000000000000000",
  createdAt: new Date("2026-03-04"),
  updatedAt: new Date("2026-03-04")
};
