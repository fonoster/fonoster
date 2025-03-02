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
import { getEnumValue, isMapping } from "./utils";

function jsonToObject<J extends Record<string, unknown>, T>(params: {
  json: J;
  objectConstructor: new () => T;
  enumMapping?: MappingTuple<unknown>;
  objectMapping?: MappingTuple<unknown>;
}): T {
  const {
    json,
    objectConstructor: ObjectConstructor,
    enumMapping,
    objectMapping
  } = params;
  const instance = new ObjectConstructor();

  Object.keys(json).forEach((key) => {
    const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;

    if (json[key] === null || json[key] === undefined) {
      return;
    }

    if (isMapping(key, enumMapping)) {
      const enumValue = getEnumValue(key, json[key] as string, enumMapping);
      instance[setterName](enumValue);
    } else if (isMapping(key, objectMapping)) {
      const objectValue = jsonToObject({
        json: json[key] as Record<string, unknown>,
        objectConstructor: objectMapping.find(
          (tuple) => tuple[0] === key
        )[1] as new () => unknown,
        enumMapping,
        objectMapping
      });

      instance[setterName](objectValue);
    } else if (typeof instance[setterName] === "function") {
      instance[setterName](json[key]);
    }
  });

  return instance;
}

export { jsonToObject };
