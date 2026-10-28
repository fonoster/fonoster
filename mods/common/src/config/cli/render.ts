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
 * Renders `config/<name>.example.<ext>` into `config/<name>.<ext>` (self-host bundle, D1).
 *
 * A file whose reader resolves placeholders (KEEPS_PLACEHOLDERS: Fonoster's services and
 * routr-one's one.yaml) is the example as written: `${NAME}` and `${NAME:-default}` stay
 * placeholders that the reader resolves from its container environment, which Compose fills from
 * .env (unify-config-placeholders), so no secret is written into it. Any other file (Routr's
 * EdgePort) gets the values, since its reader doesn't resolve them; those hold no secrets. Either
 * way every `${NAME}` without a default must be set, so a missing value fails at init, not at
 * start.
 *
 * An overlay folder (the development stack's; several merge in order) may hold a
 * `<name>.<ext>` YAML that is deep-merged into the result: objects merge, other values replace,
 * and `null` removes a key.
 */
export type Env = Record<string, string | undefined>;

const REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?\}/g;

export class RenderError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join("\n"));
  }
}

/** Config files whose reader resolves `${NAME}` itself: placeholders stay in them. */
export const KEEPS_PLACEHOLDERS = [
  "fonoster",
  "identity",
  "appbridge",
  "autopilot",
  "roomr",
  "routr-one"
];

/**
 * Checks one template's placeholders and returns it with them kept (`substitute` false) or
 * replaced by their values. Problems name the file, the line and the variable, never a value.
 * Whole-line comments are copied as they are (they may mention `${NAME}`).
 */
export function renderTemplate(
  text: string,
  env: Env,
  file = "template",
  substitute = false
) {
  const problems: string[] = [];
  const out = text.split("\n").map((line, i) => {
    if (line.trimStart().startsWith("#")) return line;
    return line.replace(REF, (m, name: string, dflt, fallback: string) => {
      const v = env[name];
      if (v !== undefined && v !== "") return substitute ? v : m;
      if (dflt !== undefined) return substitute ? fallback : m;
      problems.push(`${file}:${i + 1}: \${${name}} is not set`);
      return m;
    });
  });
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

/** The rendered name of an example (`appbridge.example.yaml` → `appbridge.yaml`). */
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
    const substitute = !KEEPS_PLACEHOLDERS.includes(EXAMPLE.exec(example)![1]);
    try {
      let text = renderTemplate(
        readFileSync(join(options.configDir, example), "utf8"),
        options.env,
        `config/${example}`,
        substitute
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
                overlay,
                substitute
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
