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
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Provision the Identity database from the service configuration file — no
// environment variables. Prisma reads its datasource URL from
// APISERVER_IDENTITY_DATABASE_URL, so we set it for the subprocess from the
// config's database.url; the config file remains the single source of truth.
const i = process.argv.indexOf("--config");
const configPath = resolve(
  process.cwd(),
  i >= 0 ? process.argv[i + 1] : "./config/identity.json"
);
const { database } = JSON.parse(readFileSync(configPath, "utf8"));

execFileSync(
  "npx",
  ["--no-install", "prisma", "migrate", "deploy", "--schema", "schema.prisma"],
  {
    stdio: "inherit",
    env: { ...process.env, APISERVER_IDENTITY_DATABASE_URL: database.url }
  }
);
