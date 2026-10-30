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
import { expect } from "chai";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parse } from "yaml";
import { readEnvFile } from "../../../mods/common/src/config/envFile";

// .devcontainer/initialize.sh --refresh (#1207): .dev/.env with the dev values and generated
// secrets from init.sh, .dev/config as the bundle's files plus the dev layer and the developer's
// .dev/overlay, merged in that order; every secret kept on the next refresh.

const ROOT = path.join(__dirname, "..", "..", "..");

/** A temporary repository root with what initialize.sh reads. */
function root(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devcontainer-"));
  for (const p of [
    ".devcontainer/initialize.sh",
    ".devcontainer/config",
    "ops/bundle/init.sh",
    "ops/bundle/config",
    "ops/rebuild/merge-config.cjs"
  ])
    fs.cpSync(path.join(ROOT, p), path.join(dir, p), { recursive: true });
  return dir;
}

function refresh(dir: string) {
  const r = spawnSync("sh", [".devcontainer/initialize.sh", "--refresh"], {
    cwd: dir,
    encoding: "utf8",
    env: {
      ...process.env,
      FONOSTER_DEV_HOST_IP: "192.0.2.10",
      NODE_PATH: path.join(ROOT, "node_modules")
    }
  });
  expect(r.status, r.stderr).to.equal(0);
  return r;
}

const yaml = (dir: string, f: string) =>
  parse(fs.readFileSync(path.join(dir, ".dev", "config", f), "utf8"));

describe("@devcontainer initialize.sh --refresh", function () {
  this.timeout(60000);

  it("writes the dev values, secrets and the bundle's config with the dev layer", function () {
    // Arrange
    const dir = root();

    // Act
    refresh(dir);

    // Assert
    const env = readEnvFile(path.join(dir, ".dev", ".env"));
    expect(env.get("COMPOSE_PROJECT_NAME")).to.equal("fonoster-dev");
    expect(env.get("SUBNET_PREFIX")).to.equal("10.216.31");
    expect(env.get("HTTPS_PORT")).to.equal("8449");
    expect(env.get("PUBLIC_URL")).to.equal("https://localhost:${HTTPS_PORT}");
    expect(fs.realpathSync(env.get("CONFIG_DIR")!)).to.equal(
      fs.realpathSync(path.join(dir, ".dev", "config"))
    );
    expect(env.get("HOST_IP")).to.equal("192.0.2.10");
    expect(env.get("DEV_OWNER_PASSWORD")).to.match(/^s[0-9a-f]{32}$/);
    expect(
      fs.existsSync(path.join(dir, ".dev", "config", "keys", "private.pem"))
    ).to.equal(true);
    expect(
      fs.existsSync(path.join(dir, ".dev", "config", "tls", "server.pem"))
    ).to.equal(true);

    // Every bundle file is there, under the same name; the dev deltas are merged in.
    for (const f of fs.readdirSync(path.join(ROOT, "ops", "bundle", "config")))
      expect(fs.existsSync(path.join(dir, ".dev", "config", f)), f).to.equal(
        true
      );
    expect(yaml(dir, "appbridge.yaml").rtp.advertiseHost).to.equal(
      "${SUBNET_PREFIX}.46"
    );
    expect(yaml(dir, "appbridge.yaml").nats.user).to.equal("appbridge");
    expect(yaml(dir, "fonoster.yaml").catalog.files).to.deep.equal([
      "/workspaces/fonoster/mods/conformance/fakes.catalog.yaml"
    ]);
    // init.sh ran after the merge: the SIP port is a number, the dev TLS transport stays.
    const transport = yaml(dir, "routr-edgeport.yaml").spec.transport;
    expect(transport[0]).to.deep.equal({ protocol: "tcp", port: 5060 });
    expect(transport.map((t: { protocol: string }) => t.protocol)).to.include(
      "tls"
    );
  });

  it("keeps every secret and applies .dev/overlay last on the next refresh", function () {
    // Arrange
    const dir = root();
    refresh(dir);
    const env = fs.readFileSync(path.join(dir, ".dev", ".env"), "utf8");
    const key = fs.readFileSync(
      path.join(dir, ".dev", "config", "keys", "private.pem"),
      "utf8"
    );
    fs.mkdirSync(path.join(dir, ".dev", "overlay"));
    fs.writeFileSync(
      path.join(dir, ".dev", "overlay", "appbridge.yaml"),
      "rtp: { advertiseHost: 192.0.2.99 }\n"
    );
    // A bundle change reaches .dev/config on the next refresh.
    fs.appendFileSync(
      path.join(dir, "ops", "bundle", "config", "roomr.yaml"),
      "addedByBundle: true\n"
    );

    // Act
    refresh(dir);

    // Assert
    expect(fs.readFileSync(path.join(dir, ".dev", ".env"), "utf8")).to.equal(
      env
    );
    expect(
      fs.readFileSync(
        path.join(dir, ".dev", "config", "keys", "private.pem"),
        "utf8"
      )
    ).to.equal(key);
    expect(yaml(dir, "appbridge.yaml").rtp.advertiseHost).to.equal(
      "192.0.2.99"
    );
    expect(yaml(dir, "roomr.yaml").addedByBundle).to.equal(true);
  });
});
