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
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import Ajv2020 from "ajv/dist/2020";
import { parse } from "yaml";
import { suggestKey } from "../configHints";
import { interpolateEnv } from "../interpolateEnv";
import { isSecretRef, resolveSecretRef } from "../resolveSecretRefs";
import { expandEnv, readEnvFile } from "./envFile";
import { listExamples, renderedName } from "./render";
import { Io } from "./types";
import type { ErrorObject } from "ajv";

export type CheckOptions = { dir: string };

/**
 * Container paths under which the services mount config/ (compose.yaml): a `secret://file/...`
 * reference to one of them is read from config/ on this machine.
 */
const MOUNTS = ["/config/", "/opt/fonoster/", "/etc/fonoster/"];

/** Schema names that validate a config file of another name. */
const ALIASES: Record<string, string> = {
  apiserver: "fonoster",
  "autopilot-session": "autopilot"
};

type Problem = string;

const PLACEHOLDER = /\$\{([A-Za-z_][A-Za-z0-9_]*)(:-[^}]*)?\}/g;

function keyPath(segments: (string | number)[]): string {
  return segments
    .map((s, i) =>
      typeof s === "number" ? `[${s}]` : i === 0 ? String(s) : `.${s}`
    )
    .join("");
}

function pointerSegments(pointer: string): (string | number)[] {
  if (!pointer) return [];
  return pointer
    .slice(1)
    .split("/")
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"))
    .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
}

/** Resolves every secret:// reference in place; problems name the key path, never a value. */
function resolveRefs(
  input: unknown,
  env: Record<string, string>,
  configDir: string,
  path: (string | number)[],
  problems: Problem[]
): unknown {
  if (typeof input === "string") {
    const raw: string = input;
    // ${NAME} placeholders resolve from .env, as Compose passes it to the containers.
    if (/\$\{[^}]*\}/.test(raw)) {
      try {
        input = interpolateEnv(raw, env);
      } catch {
        const unset = [...raw.matchAll(PLACEHOLDER)]
          .filter((m) => (env[m[1]] === undefined || env[m[1]] === "") && !m[2])
          .map((m) => m[1]);
        problems.push(
          `${keyPath(path)}: ${unset.map((n) => `\${${n}}`).join(", ")} not set in .env`
        );
        return input;
      }
    }
    if (typeof input !== "string" || !isSecretRef(input)) return input;
    try {
      return resolveSecretRef(input, {
        env,
        readFile: (p) => {
          const mount = MOUNTS.find((m) => p.startsWith(m));
          const local = mount ? join(configDir, p.slice(mount.length)) : p;
          return readFileSync(existsSync(local) ? local : p, "utf8");
        }
      });
    } catch (e) {
      problems.push(`${keyPath(path)}: ${(e as Error).message}`);
      return input;
    }
  }
  if (Array.isArray(input))
    return input.map((v, i) =>
      resolveRefs(v, env, configDir, [...path, i], problems)
    );
  if (input !== null && typeof input === "object")
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [
        k,
        resolveRefs(v, env, configDir, [...path, k], problems)
      ])
    );
  return input;
}

function describe(error: ErrorObject): Problem {
  const at = pointerSegments(error.instancePath);
  if (error.keyword === "additionalProperties") {
    const key = (error.params as { additionalProperty: string })
      .additionalProperty;
    const known = Object.keys(
      (error.parentSchema as { properties?: object })?.properties ?? {}
    );
    const hint = suggestKey(key, known);
    return `${keyPath([...at, key])}: unknown key${hint ? ` (did you mean ${hint}?)` : ""}`;
  }
  if (error.keyword === "required") {
    const missing = (error.params as { missingProperty: string })
      .missingProperty;
    return `${keyPath([...at, missing])}: missing required value`;
  }
  return `${keyPath(at) || "(root)"}: ${error.message}`;
}

function loadSchemas(dir: string): Map<string, object> {
  const schemas = new Map<string, object>();
  if (!existsSync(dir)) return schemas;
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const name = file.replace(/\.json$/, "");
    schemas.set(
      ALIASES[name] ?? name,
      JSON.parse(readFileSync(join(dir, file), "utf8"))
    );
  }
  return schemas;
}

/** Validates config/*.yaml, placeholders resolved from .env, against config/schemas/*.json (D5). */
export function runCheck(options: CheckOptions, io: Io): number {
  const dir = resolve(options.dir);
  const envFile = join(dir, ".env");
  const configDir = join(dir, "config");
  if (!existsSync(envFile) || !existsSync(configDir)) {
    io.err(
      "no .env here: run `npx -p @fonoster/common fonoster-config init` first"
    );
    return 1;
  }
  const env = expandEnv(readEnvFile(envFile));
  const schemas = loadSchemas(join(configDir, "schemas"));
  if (!schemas.size)
    io.out(
      "config/schemas/ has no schemas: checking values and secret:// references only"
    );

  let failed = 0;
  const files = listExamples(configDir)
    .map((e) => renderedName(e)!)
    .filter((f) => /\.ya?ml$/.test(f));
  for (const file of files) {
    const label = `config/${file}`;
    const path = join(configDir, file);
    const problems: Problem[] = [];
    if (!existsSync(path)) {
      io.err(`${label}: missing (run init)`);
      failed++;
      continue;
    }
    let data: unknown;
    try {
      data = parse(readFileSync(path, "utf8")) ?? {};
    } catch (e) {
      io.err(`${label}: not valid YAML: ${(e as Error).message}`);
      failed++;
      continue;
    }
    const resolved = resolveRefs(data, env, configDir, [], problems);
    const schema = schemas.get(file.replace(/\.ya?ml$/, ""));
    if (schema) {
      // The exported schemas are draft 2020-12 (toJsonSchema).
      // coerceTypes: a placeholder is a string after YAML parsing; services accept "5060" for a
      // port the same way.
      const ajv = new Ajv2020({
        allErrors: true,
        coerceTypes: true,
        strict: false,
        verbose: true
      });
      const validate = ajv.compile(schema);
      if (!validate(resolved))
        for (const error of validate.errors ?? []) {
          const p = describe(error);
          if (!problems.includes(p)) problems.push(p);
        }
    }
    if (problems.length) {
      failed++;
      problems.forEach((p) => io.err(`${label}: ${p}`));
    } else
      io.out(`${label}: valid${schema ? "" : " (no schema; values only)"}`);
  }
  if (failed) {
    io.err(`${failed} file${failed > 1 ? "s" : ""} with problems`);
    return 1;
  }
  return 0;
}
