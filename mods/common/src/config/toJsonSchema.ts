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
import { ZodTypeAny } from "zod";
import { strictDeep } from "./strictDeep";

// A small Zod (v4) to JSON Schema converter for the service config schemas (add-self-host-
// installer 4.1, build log IC-B3): one JSON Schema per service, for editors and the schema tests.
// It covers the Zod types the config
// schemas use and throws on any other, so a new type can't silently export as "anything".
// Refinements (superRefine, transform) are not representable and are left out: the services
// still validate fully on boot.

export type JsonSchema = Record<string, unknown>;

type Check = {
  check: string;
  format?: string;
  pattern?: RegExp;
  minimum?: number;
  maximum?: number;
  length?: number;
  value?: number;
  inclusive?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defOf = (schema: ZodTypeAny) => schema._zod.def as any;

const checksOf = (schema: ZodTypeAny): Check[] =>
  (defOf(schema).checks ?? []).map((c: { _zod: { def: Check } }) => c._zod.def);

function stringSchema(checks: Check[]): JsonSchema {
  const out: JsonSchema = { type: "string" };
  for (const c of checks) {
    if (c.check === "min_length") out.minLength = c.minimum;
    else if (c.check === "max_length") out.maxLength = c.maximum;
    else if (c.check === "length_equals")
      out.minLength = out.maxLength = c.length;
    else if (c.check === "string_format") {
      if (c.format === "regex") out.pattern = c.pattern!.source;
      else if (c.format === "url") out.format = "uri";
      else if (c.format === "email") out.format = "email";
    }
  }
  return out;
}

function numberSchema(checks: Check[]): JsonSchema {
  const out: JsonSchema = { type: "number" };
  for (const c of checks) {
    if (c.check === "number_format" && /int/.test(c.format!))
      out.type = "integer";
    else if (c.check === "greater_than")
      out[c.inclusive ? "minimum" : "exclusiveMinimum"] = c.value;
    else if (c.check === "less_than")
      out[c.inclusive ? "maximum" : "exclusiveMaximum"] = c.value;
    else if (c.check === "multiple_of") out.multipleOf = c.value;
  }
  return out;
}

/** A preprocess is a pipe from a transform: the schema that validates is its output. */
const piped = (def: { in: ZodTypeAny; out: ZodTypeAny }) =>
  defOf(def.in).type === "transform" ? def.out : def.in;

/** Whether an object key may be left out of the input (optional, or has a default). */
function isOptionalInput(schema: ZodTypeAny): boolean {
  const def = defOf(schema);
  switch (def.type) {
    case "optional":
    case "default":
    case "prefault":
    case "any":
    case "unknown":
      return true;
    case "pipe":
      return isOptionalInput(piped(def));
    case "nullable":
      return isOptionalInput(def.innerType);
    default:
      return false;
  }
}

function convert(schema: ZodTypeAny, path: string): JsonSchema {
  const def = defOf(schema);
  const description = schema.description
    ? { description: schema.description }
    : {};
  switch (def.type) {
    case "string":
      return { ...stringSchema(checksOf(schema)), ...description };
    case "number":
      return { ...numberSchema(checksOf(schema)), ...description };
    case "boolean":
      return { type: "boolean", ...description };
    case "literal":
      return { const: def.values[0], ...description };
    case "enum":
      return {
        type: "string",
        enum: Object.values(def.entries),
        ...description
      };
    case "any":
    case "unknown":
      return { ...description };
    case "null":
      return { type: "null" };
    case "object": {
      const shape = def.shape as Record<string, ZodTypeAny>;
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = convert(value, path ? `${path}.${key}` : key);
        if (!isOptionalInput(value)) required.push(key);
      }
      // No catchall strips unknown keys; never rejects them; unknown (passthrough) keeps them.
      const catchall = def.catchall as ZodTypeAny | undefined;
      const catchallType = catchall && defOf(catchall).type;
      return {
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties:
          !catchall || catchallType === "unknown"
            ? true
            : catchallType === "never"
              ? false
              : convert(catchall, `${path}.*`),
        ...description
      };
    }
    case "array": {
      const out: JsonSchema = {
        type: "array",
        items: convert(def.element, `${path}[]`),
        ...description
      };
      for (const c of checksOf(schema)) {
        if (c.check === "min_length") out.minItems = c.minimum;
        else if (c.check === "max_length") out.maxItems = c.maximum;
        else if (c.check === "length_equals")
          out.minItems = out.maxItems = c.length;
      }
      return out;
    }
    case "record":
      return {
        type: "object",
        additionalProperties: convert(def.valueType, `${path}.*`),
        ...description
      };
    case "union":
      return {
        anyOf: (def.options as ZodTypeAny[]).map((o, i) =>
          convert(o, `${path}|${i}`)
        ),
        ...description
      };
    case "optional":
      return { ...convert(def.innerType, path), ...description };
    case "nullable":
      return {
        anyOf: [convert(def.innerType, path), { type: "null" }],
        ...description
      };
    case "default":
    case "prefault": {
      const inner = convert(def.innerType, path);
      // Object defaults such as `{}` are filled in by the inner schema; only scalars are shown.
      const value = def.defaultValue;
      return {
        ...inner,
        ...(value === null || typeof value !== "object"
          ? { default: value }
          : {}),
        ...description
      };
    }
    case "pipe":
      return { ...convert(piped(def), path), ...description };
    case "catch":
    case "readonly":
      return convert(def.innerType, path);
    case "lazy":
      return convert(def.getter(), path);
    default:
      throw new Error(
        `toJsonSchema: unsupported Zod type ${def.type} at ${path || "(root)"}`
      );
  }
}

/**
 * The JSON Schema (draft 2020-12) of a service config schema. Unknown keys are rejected
 * (`additionalProperties: false`) wherever the service rejects them: every object, as
 * `strictDeep` makes them, except `.passthrough()` blocks.
 */
function toJsonSchema(
  schema: ZodTypeAny,
  options: { id?: string; title?: string } = {}
): JsonSchema {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...(options.id ? { $id: options.id } : {}),
    ...(options.title ? { title: options.title } : {}),
    ...convert(strictDeep(schema), "")
  };
}

export { toJsonSchema };
