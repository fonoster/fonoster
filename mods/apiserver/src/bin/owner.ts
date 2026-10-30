#!/usr/bin/env node
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
// The first user of an install and its workspace:
//
//   docker compose exec -T apiserver fonoster-owner create <email> [--name <name>] < password-file
//
// The password comes from stdin (8 to 50 characters; a trailing newline is dropped) and is never
// printed. When the install already has its first user, nothing changes and it exits 0.
import { createPrismaClient, upsertDefaultUser } from "@fonoster/identity";
import { identityConfig } from "../core/identityConfig";

const USAGE =
  "usage: fonoster-owner create <email> [--name <name>] < password-file";

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks)
    .toString("utf8")
    .replace(/\r?\n$/, "");
}

async function main() {
  const [cmd, email, ...rest] = process.argv
    .slice(2)
    .filter((a, i, all) => a !== "--config" && all[i - 1] !== "--config");
  const at = rest.indexOf("--name");
  const name = at >= 0 ? rest[at + 1] : "Admin";
  if (cmd !== "create" || !email || !name) {
    console.error(USAGE);
    process.exit(2);
  }
  const prisma = createPrismaClient(
    identityConfig.dbUrl,
    identityConfig.encryptionKey
  );
  const existing = await prisma.user.findUnique({
    where: { ref: "00000000-0000-0000-0000-000000000000" }
  });
  await prisma.$disconnect();
  if (existing) {
    console.log(`the first user exists (${existing.email}); nothing changed`);
    return;
  }
  const password = await readStdin();
  if (password.length < 8 || password.length > 50) {
    console.error(
      "the password on stdin must have 8 to 50 characters (" + USAGE + ")"
    );
    process.exit(1);
  }
  await upsertDefaultUser(identityConfig, { name, email, password });
  console.log(`created ${email} and its workspace`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
