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
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The canonical Identity proto lives in @fonoster/common. We copy it at build
// time rather than vendoring a committed copy, so there is a single source.
const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../common/src/protos/identity.proto");
const destDir = resolve(here, "../proto");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, resolve(destDir, "identity.proto"));
console.log("synced identity.proto from @fonoster/common");
