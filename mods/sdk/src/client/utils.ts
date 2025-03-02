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

function isMapping(key: string, objectMapping: MappingTuple<unknown>): boolean {
  return objectMapping?.some((tuple) => tuple[0] === key);
}

function getEnumValue(
  key: string,
  value: string,
  enumMapping: MappingTuple<unknown>
): number {
  // Added to support the edge case of "PRIVATE" being passed as "ID"
  const realValue = value === "ID" ? "PRIVATE" : value;
  const tuple = enumMapping.find((tuple) => tuple[0] === key);
  return (tuple ? tuple[1][realValue] : 0) as number;
}

function getEnumKey(
  key: string,
  value: number,
  enumMapping: MappingTuple<unknown>
): string {
  const tuple = enumMapping.find((tuple) => tuple[0] === key);
  const result = Object.keys(tuple[1]).find((k) => tuple[1][k] === value) || "";
  // Added to support the edge case of "PRIVATE" being returned as "ID"
  return result === "PRIVATE" ? "ID" : result;
}

export { getEnumKey, getEnumValue, isMapping };
