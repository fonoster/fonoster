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
import { z, ZodTypeAny } from "zod";

/** Types with nothing inside them to make strict. */
const LEAVES = new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "date",
  "symbol",
  "undefined",
  "null",
  "any",
  "unknown",
  "never",
  "void",
  "enum",
  "literal",
  "nan",
  "template_literal",
  "file",
  "custom",
  "transform"
]);

/** Wrappers whose one inner type is `innerType`. */
const WRAPPERS = new Set([
  "optional",
  "nullable",
  "default",
  "prefault",
  "readonly",
  "catch",
  "nonoptional"
]);

/**
 * Returns a copy of `schema` in which every object rejects unknown keys, so a
 * misspelled config key fails validation instead of being silently dropped.
 * Objects declared with `.passthrough()` (free-form blocks such as provider
 * credentials) or with a catchall are left open. Throws on a Zod type it can't
 * look inside, so a new type can't silently stay loose.
 */
function strictDeep<T extends ZodTypeAny>(schema: T): T {
  // Zod 4 internals: each schema's definition and `clone(def)` to rebuild it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = schema._zod.def as any;
  const rebuild = (changes: Record<string, unknown>) =>
    // `parent` keeps metadata such as `.describe()` on the copy.
    schema.clone({ ...def, ...changes }, { parent: true }) as T;

  if (LEAVES.has(def.type)) return schema;

  if (WRAPPERS.has(def.type)) {
    return rebuild({ innerType: strictDeep(def.innerType) });
  }

  switch (def.type) {
    case "object": {
      const shape = Object.fromEntries(
        Object.entries((schema as unknown as z.ZodObject).shape).map(
          ([key, value]) => [key, strictDeep(value as ZodTypeAny)]
        )
      );
      // A passthrough object's catchall is `unknown`; a stripping one has none.
      const open = def.catchall && def.catchall._zod.def.type !== "never";
      return rebuild({
        shape,
        catchall: open ? strictDeep(def.catchall) : z.never()
      });
    }
    case "array":
      return rebuild({ element: strictDeep(def.element) });
    case "union":
      return rebuild({ options: def.options.map(strictDeep) });
    case "intersection":
      return rebuild({
        left: strictDeep(def.left),
        right: strictDeep(def.right)
      });
    case "record":
      return rebuild({ valueType: strictDeep(def.valueType) });
    case "pipe":
      return rebuild({ in: strictDeep(def.in), out: strictDeep(def.out) });
    case "lazy": {
      const getter = def.getter;
      return rebuild({ getter: () => strictDeep(getter()) });
    }
    default:
      throw new Error(`strictDeep: unsupported Zod type ${def.type}`);
  }
}

export { strictDeep };
