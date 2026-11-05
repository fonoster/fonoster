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
import * as fs from "fs";
// The trace module alone: the package root also loads Redis, Auth and Tracer.
import { TraceRecord, validateRecord } from "@routr/common/dist/trace";

/**
 * Parses the text of a Routr recording, one record per line, validated with
 * Routr's own schema. A line that fails to parse or validate is skipped (a
 * file still being written ends with a truncated line).
 */
export function parseCall(text: string): TraceRecord[] {
  return text
    .split("\n")
    .map((raw) => raw.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      try {
        return [validateRecord(JSON.parse(line))];
      } catch {
        return []; // skipped: not a record
      }
    });
}

/** Reads a Routr recording (see parseCall). Throws when the file can't be read. */
export function readCall(path: string): TraceRecord[] {
  return parseCall(fs.readFileSync(path, "utf8"));
}
