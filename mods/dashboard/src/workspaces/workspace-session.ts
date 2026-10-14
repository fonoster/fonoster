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
import { STORAGE_KEYS, storage } from "~/lib/storage";

export function rememberedWorkspace(): string | null {
  return storage.get(STORAGE_KEYS.workspace);
}

export function rememberWorkspace(ref: string) {
  storage.set(STORAGE_KEYS.workspace, ref);
}

export function workspacePath(ref: string) {
  return `/w/${ref}`;
}

/** Where to go after sign-in: the remembered workspace, the only one, or the picker. */
export function landingTarget(
  workspaces: Workspace[],
  remembered = rememberedWorkspace()
): string {
  if (workspaces.length === 0) return "/workspaces/new";
  if (remembered && workspaces.some((w) => w.ref === remembered))
    return workspacePath(remembered);
  return "/workspaces";
}
