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
import { NumberFormat } from "@fonoster/types";

/** Routr names "leave as is" UNSPECIFIED; Fonoster's proto names it NUMBER_FORMAT_UNSPECIFIED. */
const ROUTR_UNSPECIFIED = "UNSPECIFIED";
const FORMAT_FIELDS = ["calledNumberFormat", "callerNumberFormat"] as const;

/**
 * A Trunk request with its number formats in Routr's names. The reset is sent explicitly: an
 * enum name Routr doesn't know would arrive as absent, and Routr would keep the stored format.
 * Prefixes pass through as sent, `""` included (it clears the stored prefix).
 */
function toRoutrNumberFormats<T extends object>(request: T): T {
  const out = { ...request } as Record<string, unknown>;
  for (const field of FORMAT_FIELDS) {
    if (out[field] === NumberFormat.NUMBER_FORMAT_UNSPECIFIED)
      out[field] = ROUTR_UNSPECIFIED;
  }
  return out as T;
}

/** A Trunk from Routr with its number formats in Fonoster's names (unset reads as leave as is). */
function toFonosterNumberFormats<T extends object>(trunk: T): T {
  if (!trunk) return trunk;
  const out = { ...trunk } as Record<string, unknown>;
  for (const field of FORMAT_FIELDS) {
    if (out[field] === undefined || out[field] === ROUTR_UNSPECIFIED)
      out[field] = NumberFormat.NUMBER_FORMAT_UNSPECIFIED;
  }
  return out as T;
}

export { toFonosterNumberFormats, toRoutrNumberFormats };
