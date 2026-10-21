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
import { spawnSync } from "child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "fs";
import { builtinModules } from "module";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { expect } from "chai";

// identity-service, on the built package (`npm run build`): the standalone server's code never
// reaches telephony, importing the library starts nothing, and a config without a required
// setting stops the server before it listens.

const IDENTITY_DIR = resolve(__dirname, "../..");
const SERVER = join(IDENTITY_DIR, "dist/server/index.js");
const TELEPHONY = ["nats", "@routr/sdk", "@fonoster/voice", "@fonoster/apiserver", "@fonoster/sipnet", "@fonoster/appbridge"];

/** The bare packages reached from a compiled file through its relative requires. */
function packagesReachedFrom(entry: string) {
  const seen = new Set<string>();
  const packages = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    for (const [, spec] of readFileSync(file, "utf8").matchAll(/require\("([^"]+)"\)/g)) {
      if (spec.startsWith(".")) {
        const base = resolve(dirname(file), spec);
        visit([base, `${base}.js`, join(base, "index.js")].find((f) => existsSync(f) && f.endsWith(".js")) ?? base);
      } else if (!builtinModules.includes(spec.replace(/^node:/, ""))) {
        packages.add(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
      }
    }
  };
  visit(entry);
  return [...packages];
}

describe("@identity[server-free]", function () {
  this.timeout(30_000);

  before(function () {
    if (!existsSync(SERVER)) throw new Error("run `npm run build` in mods/identity first");
  });

  it("[API-062] the standalone server reaches no telephony package", function () {
    const reached = packagesReachedFrom(SERVER);

    expect(reached).to.include("@grpc/grpc-js");
    expect(reached.filter((p) => TELEPHONY.includes(p))).to.deep.equal([]);
  });

  it("[API-063] importing the library starts no server and leaves nothing running", function () {
    const run = spawnSync(
      process.execPath,
      ["-e", `require(${JSON.stringify(IDENTITY_DIR)}); setTimeout(() => {}, 0);`],
      { encoding: "utf8", timeout: 10_000 }
    );

    expect(run.error, "exited by itself").to.equal(undefined);
    expect(run.status).to.equal(0);
    expect(run.stdout + run.stderr).to.not.match(/listening|running at|serving/i);
  });

  it("[API-061] a config missing a required setting stops the server with a message naming it", function () {
    const dir = mkdtempSync(join(tmpdir(), "identity-config-"));
    const config = join(dir, "identity.json");
    // A valid encryption key, but no issuer and no database: both required.
    writeFileSync(
      config,
      JSON.stringify({
        server: { bindAddr: "127.0.0.1:0" },
        encryptionKey: `k1.aesgcm256.${Buffer.alloc(32, 7).toString("base64url")}=`
      })
    );

    const run = spawnSync(process.execPath, [SERVER, "--config", config], {
      cwd: IDENTITY_DIR,
      // The test run silences logs; the server's own complaint is what is checked.
      env: { ...process.env, LOGS_LEVEL: "info" },
      encoding: "utf8",
      timeout: 15_000
    });

    expect(run.error, "exited by itself").to.equal(undefined);
    expect(run.status).to.not.equal(0);
    expect(run.stdout + run.stderr).to.match(/issuer|database/i);
  });
});
