/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { getEnumValue, isEnum } from "./enumsUtil";
import { EnumMapping } from "./types";

// When converting to repeated fields, the incoming fields
// must be appended with "List"
function jsonToObject<J extends Record<string, unknown>, T>(
  json: J,
  ObjectConstructor: new () => T,
  enumMapping?: EnumMapping<unknown>
): T {
  const instance = new ObjectConstructor();

  Object.keys(json).forEach((key) => {
    const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;

    if (isEnum(key, enumMapping)) {
      const enumValue = getEnumValue(key, json[key] as string, enumMapping);
      instance[setterName](enumValue);
    } else if (typeof instance[setterName] === "function") {
      instance[setterName](json[key]);
    }
  });

  return instance as T;
}

export { jsonToObject };
