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
import { execFileSync } from "child_process";
import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import * as path from "path";

// A throwaway database for the persistence tests: a fresh database on the server named by
// PERSISTENCE_TEST_DATABASE_URL, migrated with the apiserver's migrations, and a Prisma client
// generated from the apiserver's schema into test/.prisma-client (git-ignored). Tests skip when the
// variable is not set.

const ROOT = path.resolve(__dirname, "../../../..");
const APISERVER = path.join(ROOT, "mods/apiserver");
const CLIENT_DIR = path.join(ROOT, "mods/common/test/.prisma-client");
const WORK_DIR = path.join(ROOT, "mods/common/test/.prisma-work");
const PRISMA = path.join(ROOT, "node_modules/.bin/prisma");

export const testDatabaseUrl = () => process.env.PERSISTENCE_TEST_DATABASE_URL;

function schemaWithOutput(dir: string) {
  const schema = fs
    .readFileSync(path.join(APISERVER, "schema.prisma"), "utf8")
    .replace(
      'provider = "prisma-client-js"',
      `provider = "prisma-client-js"\n  output   = "${CLIENT_DIR}"`
    );
  fs.writeFileSync(path.join(dir, "schema.prisma"), schema);
  fs.cpSync(path.join(APISERVER, "migrations"), path.join(dir, "migrations"), {
    recursive: true
  });
  return path.join(dir, "schema.prisma");
}

/** Generates the client once per schema version. */
function generate(schemaFile: string, url: string) {
  const hash = createHash("sha256")
    .update(fs.readFileSync(path.join(APISERVER, "schema.prisma")))
    .digest("hex");
  const stamp = path.join(CLIENT_DIR, ".schema-hash");
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === hash) return;
  execFileSync(PRISMA, ["generate", "--schema", schemaFile], {
    stdio: "pipe",
    env: {
      ...process.env,
      APISERVER_DATABASE_URL: url,
      PRISMA_HIDE_UPDATE_MESSAGE: "1"
    }
  });
  fs.writeFileSync(stamp, hash);
}

export type TestDb = {
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
  drop(): Promise<void>;
};

/** Creates and migrates a fresh database; undefined when no test server is configured. */
export async function createTestDb(): Promise<TestDb | undefined> {
  const base = testDatabaseUrl();
  if (!base) return undefined;
  // Inside the repository, so Prisma finds the project (and never tries to install itself).
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const dir = fs.mkdtempSync(path.join(WORK_DIR, "db-"));
  const schemaFile = schemaWithOutput(dir);
  generate(schemaFile, base);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require(CLIENT_DIR);
  const name = `rb_test_${randomBytes(6).toString("hex")}`;
  const admin = new PrismaClient({ datasourceUrl: base });
  await admin.$executeRawUnsafe(`CREATE DATABASE ${name}`);
  const u = new URL(base);
  u.pathname = `/${name}`;
  const url = u.toString();
  execFileSync(PRISMA, ["migrate", "deploy", "--schema", schemaFile], {
    stdio: "pipe",
    env: {
      ...process.env,
      APISERVER_DATABASE_URL: url,
      PRISMA_HIDE_UPDATE_MESSAGE: "1"
    }
  });
  const prisma = new PrismaClient({ datasourceUrl: url });
  return {
    url,
    prisma,
    async drop() {
      await prisma.$disconnect();
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${name}`);
      await admin.$disconnect();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}
