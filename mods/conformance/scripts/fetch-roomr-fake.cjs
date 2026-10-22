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
// Downloads the roomr-fake binary of the pinned @fonoster/roomr version from its GitHub release
// (extract-roomr 2.3) into .roomr-fake/<version>/roomr-fake, where sharedRoomrFake finds it. With
// --print it prints the path (CI: ROOMR_FAKE_BIN=$(node scripts/fetch-roomr-fake.cjs --print)).
// It never fails an install: without the binary, the suites fall back to the Docker image.
const fs = require("fs");
const https = require("https");
const path = require("path");

const ARCH = { x64: "amd64", arm64: "arm64" };

function target() {
  // The package's exports do not list package.json: read it next to dist/.
  const pkg = path.join(
    require.resolve("@fonoster/roomr"),
    "..",
    "..",
    "package.json"
  );
  const { version } = JSON.parse(fs.readFileSync(pkg, "utf8"));
  const os = process.platform;
  const arch = ARCH[process.arch];
  if (!["linux", "darwin"].includes(os) || !arch) return undefined;
  return {
    version,
    url: `https://github.com/fonoster/roomr/releases/download/v${version}/roomr-fake-${os}-${arch}`,
    file: path.join(__dirname, "..", ".roomr-fake", version, "roomr-fake")
  };
}

function download(url, file, redirects = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects > 0
        ) {
          res.resume();
          return resolve(download(res.headers.location, file, redirects - 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`${url}: HTTP ${res.statusCode}`));
        }
        const tmp = `${file}.part`;
        const out = fs.createWriteStream(tmp, { mode: 0o755 });
        res.pipe(out);
        out.on("finish", () =>
          out.close(() => (fs.renameSync(tmp, file), resolve()))
        );
        out.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  const t = target();
  if (!t) return;
  if (!fs.existsSync(t.file)) {
    fs.mkdirSync(path.dirname(t.file), { recursive: true });
    await download(t.url, t.file);
  }
  if (process.argv.includes("--print")) console.log(t.file);
}

main().catch((err) => {
  console.warn(
    `roomr-fake not downloaded (the suites will use Docker): ${err.message}`
  );
  if (process.argv.includes("--print")) process.exit(1);
});
