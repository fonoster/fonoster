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
import { spawnSync } from "child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { readEnvFile } from "../../../src/config/cli/envFile";

// #1200: `npm run dev:config` (.devcontainer/initialize.sh --refresh) brings an older .dev up to
// the bundle's Routr files, says which ones changed and how to recreate Routr on the host, and the
// dev Routr serves SIP over TLS on 5061 with the generated certificate. The script runs in a
// temporary ROOT holding copies of .devcontainer and ops/bundle; with no mods/common/dist there,
// it takes the tsx branch and runs this source, not a stale build.

const REPO = join(__dirname, "../../../../..");
const HOST_IP = "192.0.2.10";
const HINT_COMMAND =
  "[dev-config]   docker compose -f .devcontainer/compose.yaml --env-file .dev/.env up -d --no-deps --force-recreate routr";
const changedLine = (files: string[]) =>
  `[dev-config] changed: ${files.join(", ")}. The running Routr keeps its old image and config until it is recreated. On the host, from the repository root:`;

// The EdgePort a .dev from before #1177/#1195 has (SSLv3, no wss, no tls).
const OLD_EDGEPORT = `kind: EdgePort
apiVersion: v2beta1
ref: default
metadata:
  region: default
spec:
  unknownMethodAction: Discard
  processor:
    addr: localhost:51901
  securityContext:
    client:
      protocols: [SSLv3, TLSv1.2]
      authType: DisabledAll
    keyStorePassword: changeme
    keyStore: "/etc/routr/certs/signaling.p12"
    keyStoreType: pkcs12
  methods: [REGISTER, MESSAGE, INVITE, ACK, BYE, CANCEL]
  transport:
    - protocol: tcp
      port: 5060
    - protocol: udp
      port: 5060
    - protocol: ws
      port: 5062
`;

/** A temporary ROOT with the dev container's script, overlays and compose, and the bundle. */
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "fonoster-devcontainer-"));
  mkdirSync(join(root, ".devcontainer"));
  for (const entry of ["initialize.sh", "config", "compose.yaml"]) {
    cpSync(
      join(REPO, ".devcontainer", entry),
      join(root, ".devcontainer", entry),
      {
        recursive: true
      }
    );
  }
  mkdirSync(join(root, "ops"));
  cpSync(join(REPO, "ops/bundle"), join(root, "ops/bundle"), {
    recursive: true
  });
  mkdirSync(join(root, "mods/common"), { recursive: true });
  symlinkSync(join(REPO, "mods/common/src"), join(root, "mods/common/src"));
  symlinkSync(join(REPO, "node_modules"), join(root, "node_modules"));
  return root;
}

function refresh(root: string) {
  const run = spawnSync("sh", [".devcontainer/initialize.sh", "--refresh"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, FONOSTER_DEV_HOST_IP: HOST_IP }
  });
  return { code: run.status, err: run.stderr, lines: run.stderr.split("\n") };
}

const config = (root: string, file: string) => join(root, ".dev/config", file);
const mode = (path: string) => statSync(path).mode & 0o777;
const hintLines = (lines: string[]) =>
  lines.filter((l) => l.includes("changed:") || l.includes("docker compose"));

/** Every .dev/.env value and every .dev/config/keys file, for byte-for-byte comparisons. */
function secrets(root: string) {
  const env = Object.fromEntries(readEnvFile(join(root, ".dev/.env")));
  const keysDir = config(root, "keys");
  const keys = Object.fromEntries(
    readdirSync(keysDir, { recursive: true })
      .map(String)
      .filter((f) => statSync(join(keysDir, f)).isFile())
      .map((f) => [f, readFileSync(join(keysDir, f)).toString("base64")])
  );
  return { env, keys };
}

describe("@common[config/devContainer]", function () {
  this.timeout(120000);
  let base: string;

  // One initialized .dev, copied for each case.
  before(function () {
    base = makeRoot();
    const first = refresh(base);
    expect(first.code, first.err).to.equal(0);
  });

  after(function () {
    rmSync(base, { recursive: true, force: true });
  });

  function copyOfBase(): string {
    const root = makeRoot();
    cpSync(join(base, ".dev"), join(root, ".dev"), { recursive: true });
    return root;
  }

  it("brings a .dev from before #1177/#1195 up to date and prints the recreate command", function () {
    // Arrange
    const root = copyOfBase();
    const before = secrets(root);
    rmSync(config(root, "routr-one.yaml"));
    rmSync(config(root, "routr-rtprelay.yaml"));
    rmSync(config(root, "tls"), { recursive: true });
    writeFileSync(config(root, "routr-edgeport.yaml"), OLD_EDGEPORT);

    // Act
    const run = refresh(root);

    // Assert
    expect(run.code, run.err).to.equal(0);
    for (const file of [
      "routr-one.yaml",
      "routr-rtprelay.yaml",
      "routr-edgeport.yaml",
      "tls/ca.pem",
      "tls/server.pem",
      "tls/server-key.pem"
    ]) {
      expect(existsSync(config(root, file)), file).to.equal(true);
    }
    expect(
      readFileSync(config(root, "routr-edgeport.yaml"), "utf8")
    ).to.not.include("SSLv3");
    expect(hintLines(run.lines)).to.deep.equal([
      changedLine([
        "routr-edgeport.yaml",
        "routr-one.yaml",
        "routr-rtprelay.yaml"
      ]),
      HINT_COMMAND
    ]);
    const lastRendered = run.lines.findIndex((l) =>
      l.startsWith("[dev-config] rendered ")
    );
    expect(run.lines[lastRendered + 1]).to.equal(
      changedLine([
        "routr-edgeport.yaml",
        "routr-one.yaml",
        "routr-rtprelay.yaml"
      ])
    );
    expect(secrets(root)).to.deep.equal(before);
  });

  it("names only the routr file that changed", function () {
    // Arrange
    const root = copyOfBase();
    writeFileSync(
      config(root, "routr-rtprelay.yaml"),
      readFileSync(config(root, "routr-rtprelay.yaml"), "utf8") + "# stale\n"
    );

    // Act
    const run = refresh(root);

    // Assert
    expect(run.code, run.err).to.equal(0);
    expect(hintLines(run.lines)).to.deep.equal([
      changedLine(["routr-rtprelay.yaml"]),
      HINT_COMMAND
    ]);
  });

  it("prints no recreate hint for a current .dev", function () {
    // Arrange
    const root = copyOfBase();

    // Act
    const run = refresh(root);

    // Assert
    expect(run.code, run.err).to.equal(0);
    expect(hintLines(run.lines)).to.deep.equal([]);
  });

  it("renders the dev EdgePort with SIP over TLS on 5061, the image's keystore password and no truststore", function () {
    // Arrange
    const sipPort = Number(
      readEnvFile(join(base, ".dev/.env")).get("SIP_PORT")
    );

    // Act
    const text = readFileSync(config(base, "routr-edgeport.yaml"), "utf8");
    const edgeport = parse(text);

    // Assert
    expect(text).to.not.include("${");
    expect(edgeport.spec.transport).to.deep.equal([
      { protocol: "tcp", port: sipPort },
      { protocol: "udp", port: sipPort },
      { protocol: "ws", port: 5062 },
      { protocol: "wss", port: 5063 },
      { protocol: "tls", port: 5061 }
    ]);
    expect(edgeport.spec.securityContext.keyStorePassword).to.equal("changeme");
    expect(edgeport.spec.securityContext).to.not.have.property("trustStore");
  });

  it("extends the bundle's routr service with the certificate mounts and 5061, and nothing else", function () {
    // Arrange
    const text = readFileSync(join(REPO, ".devcontainer/compose.yaml"), "utf8");

    // Act
    const { routr } = parse(text, { logLevel: "error" }).services;

    // Assert
    expect(routr.extends).to.deep.equal({
      file: "../ops/bundle/compose.yaml",
      service: "routr"
    });
    for (const key of ["image", "environment", "command"]) {
      expect(routr, key).to.not.have.property(key);
    }
    expect(routr.volumes).to.deep.equal(
      [
        ["server.pem", "server.crt"],
        ["server-key.pem", "server.key"],
        ["ca.pem", "ca.crt"]
      ].map(([file, target]) => ({
        type: "bind",
        source: `../.dev/config/tls/${file}`,
        target: `/etc/routr/certs/${target}`,
        read_only: true,
        bind: { create_host_path: false }
      }))
    );
    expect(routr.ports).to.deep.equal(["5061:5061/tcp"]);
  });

  it("keeps every .env value and every key byte for byte", function () {
    // Arrange
    const root = copyOfBase();
    const before = secrets(root);

    // Act
    const run = refresh(root);

    // Assert
    expect(run.code, run.err).to.equal(0);
    expect(secrets(root)).to.deep.equal(before);
  });

  it("makes a 0600 generated server key readable by Routr's user, same bytes, and leaves the CA key 0600", function () {
    // Arrange
    const root = copyOfBase();
    const key = config(root, "tls/server-key.pem");
    const bytes = readFileSync(key, "base64");
    chmodSync(key, 0o600);

    // Act
    const run = refresh(root);

    // Assert
    expect(run.code, run.err).to.equal(0);
    expect(mode(key)).to.equal(0o644);
    expect(readFileSync(key, "base64")).to.equal(bytes);
    expect(mode(config(root, "tls/ca-key.pem"))).to.equal(0o600);
  });

  it("makes a kept .dev's 0600 server key readable by Routr's user when the container reopens", function () {
    // Arrange: host mode keeps a current .dev and skips init; docker is stubbed (the image build)
    const root = copyOfBase();
    const key = config(root, "tls/server-key.pem");
    const bytes = readFileSync(key, "base64");
    chmodSync(key, 0o600);
    const bin = mkdtempSync(join(tmpdir(), "fonoster-docker-stub-"));
    writeFileSync(join(bin, "docker"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });

    // Act
    const run = spawnSync("sh", [".devcontainer/initialize.sh"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        FONOSTER_DEV_HOST_IP: HOST_IP
      }
    });

    // Assert
    expect(run.status, run.stderr).to.equal(0);
    expect(run.stderr).to.include("keeping");
    expect(mode(key)).to.equal(0o644);
    expect(readFileSync(key, "base64")).to.equal(bytes);
    expect(mode(config(root, "tls/ca-key.pem"))).to.equal(0o600);
    rmSync(bin, { recursive: true, force: true });
  });
});
