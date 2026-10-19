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
const fs = require("fs");
const path = require("path");

const pkgDir = path.resolve(__dirname, "..");
const src = path.join(pkgDir, "src");
const dist = path.join(pkgDir, "dist");

// The email templates (*.hbs) next to the compiled code.
fs.cpSync(path.join(src, "templates"), path.join(dist, "templates"), {
  recursive: true,
  filter: (source) => fs.statSync(source).isDirectory() || source.endsWith(".hbs")
});

// The generated Prisma client, where the compiled code imports it from.
fs.mkdirSync(path.join(dist, "generated/@prisma"), { recursive: true });
fs.cpSync(
  path.join(src, "generated/@prisma/client"),
  path.join(dist, "generated/@prisma/client"),
  { recursive: true }
);
