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
import { getEnumKey, isMapping } from "./utils";

function objectToJson<J extends Record<string, unknown>>(
  obj: new () => unknown,
  enumMapping?: MappingTuple<unknown>,
  objectMapping?: MappingTuple<unknown>,
  repeatableObjectMapping?: MappingTuple<unknown>
): J {
  const json: Record<string, unknown> = {};
  const includeEmptyStringProps = new Set(["nextPageToken"]);

  Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).forEach((key) => {
    if (
      key.startsWith("get") &&
      typeof obj[key] === "function" &&
      key !== "getPrototypeOf"
    ) {
      const propName = key.charAt(3).toLowerCase() + key.slice(4);
      try {
        const value = obj[key]();

        if (value === null || value === undefined) {
          return;
        }

        if (value === "" && !includeEmptyStringProps.has(propName)) {
          return;
        }

        if (isMapping(propName, enumMapping)) {
          json[propName] = getEnumKey(propName, value as number, enumMapping);
        } else if (isMapping(propName, objectMapping)) {
          json[propName] = objectToJson(
            value as new () => unknown,
            enumMapping,
            objectMapping,
            repeatableObjectMapping
          );
        } else if (isMapping(propName, repeatableObjectMapping)) {
          // Remove the "List" ending from the key
          const repeatableKey = propName.slice(0, -4);

          json[repeatableKey] = (value as unknown[]).map((item) =>
            objectToJson(
              item as new () => unknown,
              enumMapping,
              objectMapping,
              repeatableObjectMapping
            )
          );
        } else if (value !== undefined) {
          if (
            ["createdAt", "updatedAt", "startedAt", "endedAt"].includes(
              propName
            )
          ) {
            json[propName] = new Date(value * 1000);
            return;
          }
          json[propName] = value;
        }
      } catch (error) {
        // Ignore
      }
    }
  });

  return json as J;
}

export { objectToJson };
