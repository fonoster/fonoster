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
import { contentHash } from "./sign";
import { FilePart, Part, SealingPart, StoredPart } from "./types";

export const isFilePart = (p: SealingPart): p is FilePart => "file" in p;
export const isStoredPart = (p: SealingPart): p is StoredPart =>
  "stored" in p && !("data" in p);
export const isDataPart = (p: SealingPart): p is Part => "data" in p;

export function partSize(p: SealingPart): number {
  return isDataPart(p) ? p.data.length : p.size;
}

export function partHash(p: SealingPart): string {
  return isDataPart(p) ? contentHash(p.data) : p.content_hash;
}
