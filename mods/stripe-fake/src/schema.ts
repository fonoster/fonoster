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
import { readFileSync } from "fs";
import { join } from "path";
import Ajv, { ValidateFunction } from "ajv";

/** The committed subset of Stripe's OpenAPI spec (D2), next to dist/ and src/. */
const subset = JSON.parse(
  readFileSync(join(__dirname, "../spec/stripe.subset.json"), "utf8")
);

type Json = Record<string, unknown>;
type Schema = {
  type?: string;
  nullable?: boolean;
  enum?: unknown[];
  properties?: Record<string, Schema>;
  required?: string[];
  $ref?: string;
  anyOf?: Schema[];
  items?: Schema;
  requestBody?: unknown;
};

export const SPEC = subset as unknown as {
  info: { version: string };
  paths: Record<
    string,
    Record<
      string,
      {
        parameters?: { name: string; in: string }[];
        requestBody?: { content: Record<string, { schema: Schema }> };
        responses?: Record<
          string,
          { content?: Record<string, { schema: Schema }> }
        >;
      }
    >
  >;
  components: { schemas: Record<string, Schema> };
};

/** The pinned Stripe API version the fake answers as (add-stripe-fake D2). */
export const API_VERSION = SPEC.info.version;

const schemas = SPEC.components.schemas;
const resolve = (s: Schema): Schema =>
  s.$ref ? schemas[s.$ref.replace("#/components/schemas/", "")] : s;

function emptyFor(s: Schema): unknown {
  const r = resolve(s);
  if (r.nullable || s.nullable) return null;
  if (r.anyOf) return null;
  if (r.properties?.object && r.properties?.data && r.properties?.has_more)
    return { object: "list", data: [], has_more: false, url: "" };
  switch (r.type) {
    case "boolean":
      return false;
    case "integer":
    case "number":
      return 0;
    case "string":
      return r.enum ? r.enum[0] : "";
    case "array":
      return [];
    case "object":
      return r.properties ? template(r) : {};
    default:
      return null;
  }
}

function template(s: Schema): Json {
  const out: Json = {};
  (s.required ?? []).forEach((name) => {
    out[name] = emptyFor((s.properties ?? {})[name] ?? {});
  });
  return out;
}

/**
 * A complete Stripe object of a schema: every required field, filled with Stripe's empty value for
 * its type (null when nullable), then the given fields on top.
 */
export function stripeObject(schemaName: string, fields: Json): Json {
  const s = schemas[schemaName];
  if (!s) throw new Error(`unknown schema ${schemaName}`);
  return { ...template(s), ...fields, livemode: false };
}

/** The parameters a path and method accepts: the form body's properties and the query parameters. */
export function acceptedParams(
  path: string,
  method: string
): Set<string> | undefined {
  const op = SPEC.paths[path]?.[method];
  if (!op) return undefined;
  const body =
    op.requestBody?.content?.["application/x-www-form-urlencoded"]?.schema;
  return new Set([
    ...Object.keys(resolve(body ?? {}).properties ?? {}),
    ...(op.parameters ?? []).filter((p) => p.in === "query").map((p) => p.name)
  ]);
}

/** OpenAPI 3.0's `nullable` as JSON Schema: the node, or null. */
function jsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(jsonSchema);
  if (!node || typeof node !== "object") return node;
  const { nullable, ...rest } = node as Json;
  const out = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, jsonSchema(v)])
  );
  return nullable ? { anyOf: [out, { type: "null" }] } : out;
}

let ajv: Ajv | undefined;
const compiled = new Map<string, ValidateFunction>();

/** Validates a response object against the path's 200 schema (tests, D2). Returns the errors. */
export function responseErrors(
  path: string,
  method: string,
  body: unknown
): string[] {
  const schema =
    SPEC.paths[path]?.[method]?.responses?.["200"]?.content?.[
      "application/json"
    ]?.schema;
  if (!schema) return [];
  ajv ??= new Ajv({
    strict: false,
    allErrors: false,
    validateFormats: false
  }).addSchema(jsonSchema(subset) as Json, "stripe");
  const key = `${method} ${path}`;
  let validate = compiled.get(key);
  if (!validate) {
    const ref = JSON.stringify(schema).replace(
      /#\/components/g,
      "stripe#/components"
    );
    validate = ajv.compile(jsonSchema(JSON.parse(ref)) as Json);
    compiled.set(key, validate);
  }
  return validate(body)
    ? []
    : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
}
