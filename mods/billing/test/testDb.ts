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
import { randomBytes } from "crypto";
import * as path from "path";
import { URL } from "url";
import { createPrismaClient, PrismaClient } from "../src/db";

// A throwaway billing database on the server named by PERSISTENCE_TEST_DATABASE_URL, migrated with
// this package's migrations. Tests skip when the variable is not set.

const PKG = path.resolve(__dirname, "..");
const PRISMA = path.resolve(PKG, "../../node_modules/.bin/prisma");

export type BillingTestDb = { prisma: PrismaClient; drop(): Promise<void> };

export async function createBillingTestDb(): Promise<
  BillingTestDb | undefined
> {
  const base = process.env.PERSISTENCE_TEST_DATABASE_URL;
  if (!base) return undefined;
  const name = `billing_test_${randomBytes(6).toString("hex")}`;
  const admin = createPrismaClient(base);
  await admin.$executeRawUnsafe(`CREATE DATABASE ${name}`);
  const u = new URL(base);
  u.pathname = `/${name}`;
  execFileSync(
    PRISMA,
    ["migrate", "deploy", "--schema", path.join(PKG, "schema.prisma")],
    {
      stdio: "pipe",
      cwd: PKG,
      env: {
        ...process.env,
        BILLING_DATABASE_URL: u.toString(),
        PRISMA_HIDE_UPDATE_MESSAGE: "1"
      }
    }
  );
  const prisma = createPrismaClient(u.toString());
  return {
    prisma,
    async drop() {
      await prisma.$disconnect();
      await admin.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`
      );
      await admin.$disconnect();
    }
  };
}
