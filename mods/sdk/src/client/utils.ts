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
import { MappingTuple } from "./types";

function isMapping(
  key: string,
  objectMapping: MappingTuple<unknown> | undefined
): boolean {
  return objectMapping?.some((tuple) => tuple[0] === key) ?? false;
}

/** The value mapped to key (an enum object or a message constructor), if any. */
function mappingFor(
  key: string,
  mapping: MappingTuple<unknown> | undefined
): unknown {
  return mapping?.find((tuple) => tuple[0] === key)?.[1];
}

function getEnumValue(
  key: string,
  value: string,
  enumMapping: MappingTuple<unknown> | undefined
): number {
  // Added to support the edge case of "PRIVATE" being passed as "ID"
  const realValue = value === "ID" ? "PRIVATE" : value;
  const values = mappingFor(key, enumMapping) as
    | Record<string, number>
    | undefined;
  return values?.[realValue] ?? 0;
}

function getEnumKey(
  key: string,
  value: number,
  enumMapping: MappingTuple<unknown> | undefined
): string {
  const values = (mappingFor(key, enumMapping) ?? {}) as Record<string, number>;
  const result = Object.keys(values).find((k) => values[k] === value) || "";
  // Added to support the edge case of "PRIVATE" being returned as "ID"
  return result === "PRIVATE" ? "ID" : result;
}

export { getEnumKey, getEnumValue, isMapping, mappingFor };
