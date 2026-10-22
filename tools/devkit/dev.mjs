#!/usr/bin/env node
/*
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
// Runs the components we develop from source, with reload, inside the dev container
// (CONTRIBUTING.md). The dependencies (Postgres, NATS, Routr, RTPEngine, MinIO, Envoy) are the
// dev container's other services.
//
//   npm run dev                       every component, each line prefixed by its name
//   npm run dev -- appbridge autopilot   only those
//
// Each process gets the values of .dev/.env (with ${NAME} expanded, as Compose's env_file does)
// for the ${NAME} placeholders of its config file, .dev/config/<service>.yaml (passed explicitly:
// the AppBridge replicas the tests start look in /config). The Roomr node is a dev container
// service (the bundle's pinned image), not run from source.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, symlinkSync, watch } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEV = join(ROOT, ".dev");
const TSX = join(ROOT, "node_modules", ".bin", "tsx");
const config = (service) => join(DEV, "config", `${service}.yaml`);

const COLORS = [36, 35, 33, 32, 34, 31];
const NAMES = [
  "fakes",
  "apiserver",
  "appbridge",
  "autopilot",
  "dashboard"
];
const width = Math.max(...NAMES.map((n) => n.length));
const children = new Set();
let stopping = false;

function devEnv() {
  const cli = join(ROOT, "mods/common/dist/config/cli/envFile.js");
  if (!existsSync(join(DEV, ".env")) || !existsSync(cli)) {
    console.error(
      "No dev config or no build: run `bash .devcontainer/post-create.sh` (it runs when the dev container is created)."
    );
    process.exit(1);
  }
  const { readEnvFile, expandEnv } = createRequire(import.meta.url)(cli);
  return expandEnv(readEnvFile(join(DEV, ".env")), process.env);
}

function prefixer(name) {
  const color = COLORS[NAMES.indexOf(name) % COLORS.length];
  const tag = `\x1b[${color}m${name.padEnd(width)}\x1b[0m |`;
  return (stream) =>
    createInterface({ input: stream }).on("line", (line) =>
      process.stdout.write(`${tag} ${line}\n`)
    );
}

function run(name, command, args, options = {}) {
  const out = prefixer(name);
  const child = spawn(command, args, {
    cwd: options.cwd ?? ROOT,
    env: { ...process.env, ...ENV, FORCE_COLOR: "1", ...options.env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true
  });
  children.add(child);
  out(child.stdout);
  out(child.stderr);
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (stopping && children.size === 0) process.exit(0);
    if (!stopping && !options.quiet)
      process.stdout.write(
        `${name.padEnd(width)} | exited (${signal ?? `code ${code}`})\n`
      );
    options.onExit?.(code);
  });
  return child;
}

// SIGTERM, then SIGKILL: a reload should not wait for a process that drains on SIGTERM.
function stop(child) {
  const kill = (signal) => {
    try {
      process.kill(-child.pid, signal);
    } catch {
      // already gone
    }
  };
  kill("SIGTERM");
  setTimeout(() => child.exitCode === null && kill("SIGKILL"), 3000).unref();
}

const tsxWatch = (entry, ...args) => [
  TSX,
  ["watch", "--clear-screen=false", entry, ...args]
];

// The apiserver applies its migrations and seed with its own entrypoint (as in the container),
// then serves from source under tsx watch. The entrypoint expects <root>/core and
// <root>/identity, each with a schema.prisma and its migrations.
function apiserver() {
  const root = join(DEV, "migrations");
  mkdirSync(root, { recursive: true });
  for (const [dir, mod] of [
    ["core", "apiserver"],
    ["identity", "identity"]
  ])
    if (!existsSync(join(root, dir)))
      symlinkSync(join("..", "..", "mods", mod), join(root, dir));
  run(
    "apiserver",
    TSX,
    [
      "mods/apiserver/src/bin/entrypoint.ts",
      "--migrate-only",
      "--migrations-root",
      root,
      "--config",
      config("fonoster")
    ],
    {
      quiet: true,
      onExit: (code) => {
        if (stopping) return;
        if (code !== 0) {
          process.stdout.write("apiserver | migrations failed; not starting\n");
          return;
        }
        run(
          "apiserver",
          ...tsxWatch(
            "mods/apiserver/src/index.ts",
            "--config",
            config("fonoster")
          )
        );
      }
    }
  );
}

const COMPONENTS = {
  // Fake TTS (:7001), STT (:7002) and LLM (:7003): .devcontainer/config points AppBridge and
  // Autopilot at them, so calls work without vendor keys.
  fakes: () => run("fakes", TSX, ["mods/conformance/src/fakes/serve.ts"]),
  apiserver,
  appbridge: () =>
    run(
      "appbridge",
      ...tsxWatch("mods/appbridge/src/main.ts", config("appbridge"))
    ),
  autopilot: () =>
    run(
      "autopilot",
      ...tsxWatch(
        "mods/autopilot/src/session/main.ts",
        "--config",
        config("autopilot")
      )
    ),
  // Vite on :3030; Envoy (the bundle's) serves it with the API at PUBLIC_URL.
  dashboard: () =>
    run(
      "dashboard",
      "npm",
      ["run", "dev", "-w", "@fonoster/dashboard", "--", "--host", "0.0.0.0"],
      {
        env: { DASHBOARD_API_URL: ENV.PUBLIC_URL }
      }
    )
};

const wanted = process.argv.slice(2);
const unknown = wanted.filter((n) => !(n in COMPONENTS));
if (unknown.length) {
  console.error(
    `unknown component ${unknown.join(", ")}; one of ${NAMES.join(", ")}`
  );
  process.exit(2);
}

const ENV = devEnv();
for (const name of wanted.length ? wanted : NAMES) COMPONENTS[name]();
if (!wanted.length || wanted.includes("dashboard"))
  process.stdout.write(
    `\nDashboard: ${ENV.PUBLIC_URL} (sign in: npm run dev:info)\n\n`
  );

const shutdown = () => {
  if (stopping) return;
  stopping = true;
  children.forEach(stop);
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
