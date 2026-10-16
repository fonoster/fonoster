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
import { join } from "path";
import { parse, stringify } from "yaml";
import { writeWithMode } from "./envFile";

/**
 * Renders `config/<name>.example.<ext>` into `config/<name>.<ext>` (self-host bundle, D1):
 *
 *   ${NAME}            the value of NAME (an error when it is unset or empty)
 *   ${NAME:-default}   the value of NAME, or `default`
 *   #@if profile <p>   the lines up to `#@end` are kept only when COMPOSE_PROFILES lists <p>
 *   #@if <NAME>        ... only when NAME is set and not false, 0 or no
 *
 * Whole-line comments are copied as they are (they may mention `${NAME}`). An overlay folder
 * (the development stack's; several merge in order) may hold a `<name>.<ext>` YAML that is deep-merged into the result:
 * objects merge, other values replace, and `null` removes a key.
 */
export type Env = Record<string, string | undefined>;

const REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?\}/g;
const IF = /^\s*#@if\s+(.+?)\s*$/;
const END = /^\s*#@end\s*$/;

export class RenderError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join("\n"));
  }
}

function truthy(value: string | undefined) {
  return (
    value !== undefined &&
    value !== "" &&
    !["false", "0", "no"].includes(value.toLowerCase())
  );
}

export function profilesOf(env: Env): string[] {
  return (env.COMPOSE_PROFILES ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function condition(expr: string, env: Env): boolean {
  const profile = /^profile\s+([A-Za-z0-9_-]+)$/.exec(expr);
  if (profile) return profilesOf(env).includes(profile[1]);
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) return truthy(env[expr]);
  throw new Error(`unknown condition "${expr}"`);
}

/** Renders one template. Problems name the file, the line and the variable, never a value. */
export function renderTemplate(text: string, env: Env, file = "template") {
  const problems: string[] = [];
  const out: string[] = [];
  let keep: boolean | undefined;
  text.split("\n").forEach((line, i) => {
    const at = `${file}:${i + 1}`;
    const cond = IF.exec(line);
    if (cond) {
      if (keep !== undefined) problems.push(`${at}: #@if inside #@if`);
      try {
        keep = condition(cond[1], env);
      } catch (e) {
        problems.push(`${at}: ${(e as Error).message}`);
        keep = false;
      }
      return;
    }
    if (END.test(line)) {
      if (keep === undefined) problems.push(`${at}: #@end without #@if`);
      keep = undefined;
      return;
    }
    if (keep === false) return;
    if (line.trimStart().startsWith("#")) {
      out.push(line);
      return;
    }
    out.push(
      line.replace(REF, (_m, name: string, dflt, fallback: string) => {
        const v = env[name];
        if (v !== undefined && v !== "") return v;
        if (dflt !== undefined) return fallback;
        problems.push(`${at}: \${${name}} is not set`);
        return "";
      })
    );
  });
  if (keep !== undefined) problems.push(`${file}: #@if without #@end`);
  if (problems.length) throw new RenderError(problems);
  return out.join("\n");
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  v !== null && typeof v === "object" && !Array.isArray(v);

export function deepMerge(base: unknown, overlay: unknown): unknown {
  if (!isObj(base) || !isObj(overlay)) return overlay;
  const out: Obj = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    if (v === null) delete out[k];
    else out[k] = k in out ? deepMerge(out[k], v) : v;
  }
  return out;
}

export const EXAMPLE = /^(.+)\.example\.([A-Za-z0-9]+)$/;

/** The rendered name of an example (`gateway.example.yaml` → `gateway.yaml`). */
export function renderedName(example: string): string | undefined {
  const m = EXAMPLE.exec(example);
  return m ? `${m[1]}.${m[2]}` : undefined;
}

export function listExamples(configDir: string): string[] {
  return readdirSync(configDir)
    .filter((f) => EXAMPLE.test(f))
    .sort();
}

export type RenderOptions = {
  configDir: string;
  /** Where rendered files go (default configDir). */
  outDir?: string;
  env: Env;
  /** Overlay folders, merged in order. */
  overlayDirs?: string[];
  /** File mode of rendered files (default 0644). */
  mode?: number;
};

/** Renders every example of a config folder; returns the rendered file names. */
export function renderConfigDir(options: RenderOptions): string[] {
  const outDir = options.outDir ?? options.configDir;
  const problems: string[] = [];
  const rendered: { name: string; text: string }[] = [];
  for (const example of listExamples(options.configDir)) {
    const name = renderedName(example)!;
    try {
      let text = renderTemplate(
        readFileSync(join(options.configDir, example), "utf8"),
        options.env,
        `config/${example}`
      );
      const overlays = (options.overlayDirs ?? [])
        .map((d) => join(d, name))
        .filter((f) => existsSync(f));
      if (overlays.length) {
        let merged: unknown = parse(text) ?? {};
        for (const overlay of overlays)
          merged = deepMerge(
            merged,
            parse(
              renderTemplate(
                readFileSync(overlay, "utf8"),
                options.env,
                overlay
              )
            ) ?? {}
          );
        text = stringify(merged, { lineWidth: 0 });
      }
      rendered.push({ name, text });
    } catch (e) {
      if (e instanceof RenderError) problems.push(...e.problems);
      else problems.push(`config/${example}: ${(e as Error).message}`);
    }
  }
  if (problems.length) throw new RenderError(problems);
  for (const { name, text } of rendered)
    writeWithMode(join(outDir, name), text, options.mode ?? 0o644);
  return rendered.map((r) => r.name);
}
