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
import {
  ZodArray,
  ZodDefault,
  ZodEffects,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  ZodRecord,
  ZodTypeAny,
  ZodUnion
} from "zod";

/**
 * Returns a copy of `schema` in which every object rejects unknown keys, so a
 * misspelled config key fails validation instead of being silently dropped.
 * Objects declared with `.passthrough()` (free-form blocks such as provider
 * credentials) are left as they are.
 */
function strictDeep<T extends ZodTypeAny>(schema: T): T {
  if (schema instanceof ZodObject) {
    const shape = schema.shape as ZodRawShape;
    const strictShape = Object.fromEntries(
      Object.entries(shape).map(([key, value]) => [key, strictDeep(value)])
    );
    const unknownKeys =
      schema._def.unknownKeys === "passthrough" ? "passthrough" : "strict";

    return new ZodObject({
      ...schema._def,
      shape: () => strictShape,
      unknownKeys
    }) as unknown as T;
  }

  if (schema instanceof ZodOptional) {
    return new ZodOptional({
      ...schema._def,
      innerType: strictDeep(schema._def.innerType)
    }) as unknown as T;
  }

  if (schema instanceof ZodNullable) {
    return new ZodNullable({
      ...schema._def,
      innerType: strictDeep(schema._def.innerType)
    }) as unknown as T;
  }

  if (schema instanceof ZodDefault) {
    return new ZodDefault({
      ...schema._def,
      innerType: strictDeep(schema._def.innerType)
    }) as unknown as T;
  }

  if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: strictDeep(schema._def.type)
    }) as unknown as T;
  }

  if (schema instanceof ZodEffects) {
    return new ZodEffects({
      ...schema._def,
      schema: strictDeep(schema._def.schema)
    }) as unknown as T;
  }

  if (schema instanceof ZodUnion) {
    return new ZodUnion({
      ...schema._def,
      options: schema._def.options.map((option: ZodTypeAny) =>
        strictDeep(option)
      )
    }) as unknown as T;
  }

  if (schema instanceof ZodRecord) {
    return new ZodRecord({
      ...schema._def,
      valueType: strictDeep(schema._def.valueType)
    }) as unknown as T;
  }

  return schema;
}

export { strictDeep };
