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
/**
 * Container entrypoint: waits for Postgres, applies migrations, seeds, then
 * starts the API server. Everything comes from fonoster.yaml; Prisma's CLI
 * still reads its URL from an environment variable, so the URL is passed only
 * to those child processes.
 *
 *   node dist/bin/entrypoint.js [--config /opt/fonoster/fonoster.yaml]
 *                               [--migrations-root /service]
 *                               [--migrate-only | --skip-migrations]
 *
 * --migrate-only applies the migrations and the seed, then exits (the Helm migrations Job);
 * --skip-migrations waits until `prisma migrate status` reports both schemas up to date (the
 * Job applies them), then serves (replicas behind that Job).
 */
import { spawnSync } from "child_process";
import { createConnection } from "net";
import { join } from "path";
import { getConfig, getIdentityConfig } from "../config";

const argv = process.argv;
const flag = (name: string, fallback: string) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const migrationsRoot = flag("--migrations-root", "/service");
const migrateOnly = argv.includes("--migrate-only");
const skipMigrations = argv.includes("--skip-migrations");
const WAIT_TIMEOUT_MS = 30_000;
const MIGRATIONS_WAIT_MS = 15 * 60_000;

function waitForTcp(host: string, port: number, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;

  return new Promise<void>((resolve, reject) => {
    const attempt = () => {
      const socket = createConnection({ host, port });
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(
            new Error(
              `database at ${host}:${port} not reachable after ${timeoutMs / 1000}s`
            )
          );
        } else {
          setTimeout(attempt, 1000);
        }
      });
    };
    attempt();
  });
}

function run(
  step: string,
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string>
) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env }
  });

  if (result.status !== 0) {
    throw new Error(`${step} failed (exit code ${result.status})`);
  }
}

/** Polls `prisma migrate status` (exit 0 = up to date) for both schemas. */
async function waitForMigrations(coreUrl: string, identityUrl: string) {
  const deadline = Date.now() + MIGRATIONS_WAIT_MS;
  const upToDate = () =>
    [
      ["core", { APISERVER_DATABASE_URL: coreUrl }],
      ["identity", { APISERVER_IDENTITY_DATABASE_URL: identityUrl }]
    ].every(
      ([dir, env]) =>
        spawnSync("npx", ["prisma", "migrate", "status"], {
          cwd: join(migrationsRoot, dir as string),
          stdio: "ignore",
          env: { ...process.env, ...(env as Record<string, string>) }
        }).status === 0
    );
  while (!upToDate()) {
    if (Date.now() > deadline)
      throw new Error(
        `migrations not applied after ${MIGRATIONS_WAIT_MS / 1000}s (is the migrations Job running?)`
      );
    console.log("waiting for the migrations Job");
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function main() {
  // Validates fonoster.yaml (and reads the keys) before touching the database.
  const config = getConfig();
  const identity = getIdentityConfig();

  if (skipMigrations) {
    await waitForMigrations(config.database.url, identity.dbUrl);
    await import("../index");
    return;
  }

  const db = new URL(config.database.url);
  await waitForTcp(db.hostname, Number(db.port || 5432), WAIT_TIMEOUT_MS);

  run(
    "core migrations",
    "npx",
    ["prisma", "migrate", "deploy"],
    join(migrationsRoot, "core"),
    {
      APISERVER_DATABASE_URL: config.database.url
    }
  );

  run(
    "identity migrations",
    "npx",
    ["prisma", "migrate", "deploy"],
    join(migrationsRoot, "identity"),
    {
      APISERVER_IDENTITY_DATABASE_URL: identity.dbUrl
    }
  );

  run(
    "seed",
    process.execPath,
    [join(__dirname, "..", "core", "seed.js")],
    process.cwd(),
    {
      APISERVER_DATABASE_URL: config.database.url
    }
  );

  if (migrateOnly) {
    console.log("migrations and seed applied");
    process.exit(0);
  }

  await import("../index");
}

main().catch((error) => {
  // The logger isn't configured yet if the config itself is invalid.
  console.error(`apiserver failed to start: ${(error as Error).message}`);
  process.exit(1);
});
