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
import { chmodSync, readFileSync, writeFileSync } from "fs";

/**
 * Compose-style `.env` files (KEY=VALUE lines, `#` comments). Values may reference earlier names
 * as `${NAME}` or `${NAME:-default}`, which Docker Compose expands too; `expandEnv` does the same
 * for rendering. Quotes around a whole value are removed.
 */
export type EnvLine =
  | { kind: "entry"; name: string; value: string; raw: string }
  | { kind: "other"; raw: string };

const ENTRY = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/;

function unquote(value: string): string {
  const v = value.trim();
  if (
    v.length >= 2 &&
    ((v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'")))
  )
    return v.slice(1, -1);
  return v;
}

export function parseEnvLines(text: string): EnvLine[] {
  const lines = text.split(/\r?\n/);
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.map((raw) => {
    const m = raw.trimStart().startsWith("#") ? null : ENTRY.exec(raw);
    return m
      ? { kind: "entry", name: m[1], value: unquote(m[2]), raw }
      : { kind: "other", raw };
  });
}

/** The entries of an env file, by name (the last one wins, as in Compose). */
export function envEntries(lines: EnvLine[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of lines)
    if (line.kind === "entry") out.set(line.name, line.value);
  return out;
}

export function readEnvFile(file: string): Map<string, string> {
  return envEntries(parseEnvLines(readFileSync(file, "utf8")));
}

const REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?\}/g;

/** Expands `${NAME}` references between values, in order (later values see earlier ones). */
export function expandEnv(
  entries: Map<string, string>,
  base: Record<string, string | undefined> = {}
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of entries) {
    out[name] = value.replace(REF, (_m, ref: string, dflt, fallback) => {
      const v = out[ref] ?? base[ref];
      if (v !== undefined && v !== "") return v;
      return dflt !== undefined ? fallback : "";
    });
  }
  return out;
}

/** Writes a file and sets its mode (also when it already existed with another one). */
export function writeWithMode(file: string, content: string, mode: number) {
  writeFileSync(file, content, { mode });
  chmodSync(file, mode);
}

export function serializeEnvLines(lines: EnvLine[]): string {
  return lines.map((l) => l.raw).join("\n") + "\n";
}
