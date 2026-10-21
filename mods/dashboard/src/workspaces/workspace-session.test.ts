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
import { landingTarget } from "./workspace-session";

const ws = (ref: string) =>
  ({ ref, name: ref, accessKeyId: `WO${ref}` }) as Workspace;

describe("landingTarget", () => {
  it("sends a user with no workspaces to Create workspace", () => {
    expect(landingTarget([])).toBe("/workspaces/new");
  });

  it("shows the list to everyone else, however many workspaces they have", () => {
    expect(landingTarget([ws("a")])).toBe("/workspaces");
    expect(landingTarget([ws("a"), ws("b")])).toBe("/workspaces");
  });
});
