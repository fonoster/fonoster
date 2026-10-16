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
import { ZodFirstPartyTypeKind, ZodTypeAny } from "zod";
import { strictDeep } from "./strictDeep";

// A small Zod (v3) to JSON Schema converter for the service config schemas (add-self-host-
// installer 4.1, build log IC-B3): the bundle ships one JSON Schema per service and
// `fonoster-config check` validates rendered files with them. It covers the Zod types the config
// schemas use and throws on any other, so a new type can't silently export as "anything".
// Refinements (superRefine, transform) are not representable and are left out: the services
// still validate fully on boot.

export type JsonSchema = Record<string, unknown>;

type Check = {
  kind: string;
  value?: number;
  inclusive?: boolean;
  regex?: RegExp;
};

function stringSchema(checks: Check[]): JsonSchema {
  const out: JsonSchema = { type: "string" };
  for (const c of checks) {
    if (c.kind === "min") out.minLength = c.value;
    else if (c.kind === "max") out.maxLength = c.value;
    else if (c.kind === "length") out.minLength = out.maxLength = c.value;
    else if (c.kind === "regex") out.pattern = c.regex!.source;
    else if (c.kind === "url") out.format = "uri";
    else if (c.kind === "email") out.format = "email";
  }
  return out;
}

function numberSchema(checks: Check[]): JsonSchema {
  const out: JsonSchema = { type: "number" };
  for (const c of checks) {
    if (c.kind === "int") out.type = "integer";
    else if (c.kind === "min")
      out[c.inclusive ? "minimum" : "exclusiveMinimum"] = c.value;
    else if (c.kind === "max")
      out[c.inclusive ? "maximum" : "exclusiveMaximum"] = c.value;
    else if (c.kind === "multipleOf") out.multipleOf = c.value;
  }
  return out;
}

/** Whether an object key may be left out of the input (optional, or has a default). */
function isOptionalInput(schema: ZodTypeAny): boolean {
  const kind = schema._def.typeName as ZodFirstPartyTypeKind;
  if (
    kind === ZodFirstPartyTypeKind.ZodOptional ||
    kind === ZodFirstPartyTypeKind.ZodDefault
  )
    return true;
  if (kind === ZodFirstPartyTypeKind.ZodEffects)
    return isOptionalInput(schema._def.schema);
  if (kind === ZodFirstPartyTypeKind.ZodNullable)
    return isOptionalInput(schema._def.innerType);
  if (
    kind === ZodFirstPartyTypeKind.ZodAny ||
    kind === ZodFirstPartyTypeKind.ZodUnknown
  )
    return true;
  return false;
}

function convert(schema: ZodTypeAny, path: string): JsonSchema {
  const def = schema._def;
  const description = schema.description
    ? { description: schema.description }
    : {};
  switch (def.typeName as ZodFirstPartyTypeKind) {
    case ZodFirstPartyTypeKind.ZodString:
      return { ...stringSchema(def.checks), ...description };
    case ZodFirstPartyTypeKind.ZodNumber:
      return { ...numberSchema(def.checks), ...description };
    case ZodFirstPartyTypeKind.ZodBoolean:
      return { type: "boolean", ...description };
    case ZodFirstPartyTypeKind.ZodLiteral:
      return { const: def.value, ...description };
    case ZodFirstPartyTypeKind.ZodEnum:
      return { type: "string", enum: [...def.values], ...description };
    case ZodFirstPartyTypeKind.ZodAny:
    case ZodFirstPartyTypeKind.ZodUnknown:
      return { ...description };
    case ZodFirstPartyTypeKind.ZodNull:
      return { type: "null" };
    case ZodFirstPartyTypeKind.ZodObject: {
      const shape = def.shape() as Record<string, ZodTypeAny>;
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = convert(value, path ? `${path}.${key}` : key);
        if (!isOptionalInput(value)) required.push(key);
      }
      const catchall = def.catchall as ZodTypeAny | undefined;
      const hasCatchall =
        catchall && catchall._def.typeName !== ZodFirstPartyTypeKind.ZodNever;
      return {
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: hasCatchall
          ? convert(catchall, `${path}.*`)
          : def.unknownKeys !== "strict",
        ...description
      };
    }
    case ZodFirstPartyTypeKind.ZodArray: {
      const out: JsonSchema = {
        type: "array",
        items: convert(def.type, `${path}[]`),
        ...description
      };
      if (def.minLength) out.minItems = def.minLength.value;
      if (def.maxLength) out.maxItems = def.maxLength.value;
      if (def.exactLength) out.minItems = out.maxItems = def.exactLength.value;
      return out;
    }
    case ZodFirstPartyTypeKind.ZodRecord:
      return {
        type: "object",
        additionalProperties: convert(def.valueType, `${path}.*`),
        ...description
      };
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
      const options: ZodTypeAny[] = Array.isArray(def.options)
        ? def.options
        : [...def.options.values()];
      return {
        anyOf: options.map((o, i) => convert(o, `${path}|${i}`)),
        ...description
      };
    }
    case ZodFirstPartyTypeKind.ZodOptional:
      return { ...convert(def.innerType, path), ...description };
    case ZodFirstPartyTypeKind.ZodNullable:
      return {
        anyOf: [convert(def.innerType, path), { type: "null" }],
        ...description
      };
    case ZodFirstPartyTypeKind.ZodDefault: {
      const inner = convert(def.innerType, path);
      // Object defaults such as `{}` are filled in by the inner schema; only scalars are shown.
      const value = def.defaultValue();
      return {
        ...inner,
        ...(value === null || typeof value !== "object"
          ? { default: value }
          : {}),
        ...description
      };
    }
    case ZodFirstPartyTypeKind.ZodEffects:
      return { ...convert(def.schema, path), ...description };
    case ZodFirstPartyTypeKind.ZodBranded:
      return convert(def.type, path);
    case ZodFirstPartyTypeKind.ZodCatch:
      return convert(def.innerType, path);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return convert(def.innerType, path);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return convert(def.in, path);
    case ZodFirstPartyTypeKind.ZodLazy:
      return convert(def.getter(), path);
    default:
      throw new Error(
        `toJsonSchema: unsupported Zod type ${def.typeName} at ${path || "(root)"}`
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
