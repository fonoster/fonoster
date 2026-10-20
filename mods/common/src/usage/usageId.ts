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
import { createHash } from "node:crypto";
import { UsageLine } from "./types";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

function base32(bytes: Buffer): string {
  const bits = Array.from(bytes, (b) => b.toString(2).padStart(8, "0")).join(
    ""
  );
  return (bits.match(/.{1,5}/g) ?? [])
    .map((chunk) => ALPHABET[parseInt(chunk.padEnd(5, "0"), 2)])
    .join("");
}

/**
 * The id of a usage line (design D7): derived from what it measures, so reporting the same usage
 * twice yields the same id. `scope` is the callRef, the eval step key, or workspaceRef + day.
 */
export function usageId(
  scope: string,
  line: Pick<UsageLine, "meter" | "provider" | "model" | "keySource">
): string {
  const key = [
    scope,
    line.meter,
    line.provider ?? "",
    line.model ?? "",
    line.keySource ?? ""
  ].join("|");
  return (
    "usg_" + base32(createHash("sha256").update(key).digest()).slice(0, 26)
  );
}
