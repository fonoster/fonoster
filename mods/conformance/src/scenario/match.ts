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
// Pattern matching as defined in SCENARIOS.md, "Matching".

export type MatchResult = { ok: boolean; reason?: string };

const OK: MatchResult = { ok: true };

function fail(path: string, reason: string): MatchResult {
  return { ok: false, reason: `${path || "<root>"}: ${reason}` };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isOperator(p: unknown): p is Record<string, unknown> {
  if (!isPlainObject(p)) return false;
  const keys = Object.keys(p);
  return keys.length > 0 && keys.every((k) => k.startsWith("$"));
}

function show(v: unknown): string {
  const s = JSON.stringify(v);
  return s === undefined
    ? "undefined"
    : s.length > 120
      ? s.slice(0, 117) + "..."
      : s;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function matchOperator(
  op: Record<string, unknown>,
  value: unknown,
  present: boolean,
  path: string
): MatchResult {
  const keys = Object.keys(op);

  if ("$absent" in op) {
    const wantAbsent = op.$absent === true;
    if (wantAbsent === !present) return OK;
    return fail(
      path,
      wantAbsent ? `expected absent, got ${show(value)}` : "expected present"
    );
  }

  if (!present) return fail(path, "missing");

  if ("$near" in op) {
    const target = Number(op.$near);
    const tolerance = Number(op.$tolerance ?? 0);
    if (typeof value === "number" && Math.abs(value - target) <= tolerance)
      return OK;
    return fail(path, `expected ${target} ± ${tolerance}, got ${show(value)}`);
  }

  if (keys.length !== 1) {
    return fail(
      path,
      `operator object must have one key, got ${keys.join(", ")}`
    );
  }

  const [key] = keys;
  const arg = op[key];

  switch (key) {
    case "$eq":
      return deepEqual(value, arg)
        ? OK
        : fail(path, `expected ${show(arg)}, got ${show(value)}`);
    case "$gte":
    case "$lte":
    case "$gt":
    case "$lt": {
      if (typeof value !== "number")
        return fail(path, `expected a number, got ${show(value)}`);
      const n = Number(arg);
      const ok =
        key === "$gte"
          ? value >= n
          : key === "$lte"
            ? value <= n
            : key === "$gt"
              ? value > n
              : value < n;
      return ok
        ? OK
        : fail(path, `expected ${key.slice(1)} ${n}, got ${value}`);
    }
    case "$contains":
      return typeof value === "string" && value.includes(String(arg))
        ? OK
        : fail(
            path,
            `expected a string containing ${show(arg)}, got ${show(value)}`
          );
    case "$re":
      return typeof value === "string" && new RegExp(String(arg)).test(value)
        ? OK
        : fail(path, `expected a string matching /${arg}/, got ${show(value)}`);
    case "$oneOf": {
      if (!Array.isArray(arg)) return fail(path, "$oneOf takes a list");
      const reasons: string[] = [];
      for (const alt of arg) {
        const r = matchAt(alt, value, present, path);
        if (r.ok) return OK;
        reasons.push(r.reason);
      }
      return fail(path, `no alternative matched (${reasons.join("; ")})`);
    }
    case "$includes": {
      if (!Array.isArray(arg)) return fail(path, "$includes takes a list");
      if (!Array.isArray(value))
        return fail(path, `expected a list, got ${show(value)}`);
      for (const [i, want] of arg.entries()) {
        if (
          !value.some((el, j) => matchAt(want, el, true, `${path}[${j}]`).ok)
        ) {
          return fail(path, `no element matches $includes[${i}] ${show(want)}`);
        }
      }
      return OK;
    }
    case "$excludes": {
      if (!Array.isArray(arg)) return fail(path, "$excludes takes a list");
      if (!Array.isArray(value))
        return fail(path, `expected a list, got ${show(value)}`);
      for (const [i, unwanted] of arg.entries()) {
        const j = value.findIndex(
          (el, k) => matchAt(unwanted, el, true, `${path}[${k}]`).ok
        );
        if (j >= 0)
          return fail(
            path,
            `element ${j} matches $excludes[${i}] ${show(unwanted)}`
          );
      }
      return OK;
    }
    default:
      return fail(path, `unknown operator ${key}`);
  }
}

function matchAt(
  pattern: unknown,
  value: unknown,
  present: boolean,
  path: string
): MatchResult {
  if (pattern === "*") {
    return present ? OK : fail(path, "missing");
  }

  if (isOperator(pattern)) {
    return matchOperator(pattern, value, present, path);
  }

  if (!present) return fail(path, "missing");

  if (Array.isArray(pattern)) {
    if (!Array.isArray(value))
      return fail(path, `expected a list, got ${show(value)}`);
    if (value.length !== pattern.length) {
      return fail(
        path,
        `expected ${pattern.length} elements, got ${value.length}`
      );
    }
    for (let i = 0; i < pattern.length; i++) {
      const r = matchAt(pattern[i], value[i], true, `${path}[${i}]`);
      if (!r.ok) return r;
    }
    return OK;
  }

  if (isPlainObject(pattern)) {
    if (!isPlainObject(value))
      return fail(path, `expected an object, got ${show(value)}`);
    for (const [k, p] of Object.entries(pattern)) {
      const r = matchAt(p, value[k], k in value, path ? `${path}.${k}` : k);
      if (!r.ok) return r;
    }
    return OK;
  }

  return pattern === value
    ? OK
    : fail(path, `expected ${show(pattern)}, got ${show(value)}`);
}

/** Matches a value against a scenario pattern. */
export function match(pattern: unknown, value: unknown): MatchResult {
  return matchAt(pattern, value, value !== undefined, "");
}

/** Reads a dotted path such as `start.streamSid` or `tracks.0.id`. */
export function getPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, value);
}

const WHOLE_VAR = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;
const ANY_VAR = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/**
 * Replaces `${var}` in strings, recursively. A string that is exactly one variable takes the
 * variable's value with its type. Unknown variables throw, so typos fail loudly.
 */
export function interpolate<T>(value: T, vars: Record<string, unknown>): T {
  const lookup = (name: string) => {
    if (!(name in vars)) throw new Error(`unknown variable \${${name}}`);
    return vars[name];
  };

  const walk = (v: unknown): unknown => {
    if (typeof v === "string") {
      const whole = WHOLE_VAR.exec(v);
      if (whole) return lookup(whole[1]);
      return v.replace(ANY_VAR, (_, name) => String(lookup(name)));
    }
    if (Array.isArray(v)) return v.map(walk);
    if (isPlainObject(v)) {
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [k, walk(x)])
      );
    }
    return v;
  };

  return walk(value) as T;
}
