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
// `npm run sync:roomr` (extract-roomr 2.1): copies Roomr's protos from the pinned @fonoster/roomr
// (the files of its GitHub release) into src/protos. Bump the pin, run this, commit. The roomr
// client test fails while the copies differ from the pinned package.
const fs = require("fs");
const path = require("path");

const pkg = path.join(require.resolve("@fonoster/roomr"), "..", "..");
const { version } = JSON.parse(
  fs.readFileSync(path.join(pkg, "package.json"), "utf8")
);
const dest = path.join(__dirname, "..", "src", "protos");
for (const [from, to] of [
  ["roomr/v1/roomr.proto", "roomr.proto"],
  ["session/v1/session.proto", "session.proto"]
]) {
  fs.copyFileSync(path.join(pkg, "protos", from), path.join(dest, to));
}
console.log(
  `Roomr protos from @fonoster/roomr ${version} copied to mods/common/src/protos`
);
