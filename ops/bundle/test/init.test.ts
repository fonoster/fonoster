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
import { execFileSync, spawnSync } from "child_process";
import { X509Certificate } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parse } from "yaml";
import { readEnvFile } from "../../../mods/common/src/config/envFile";

// ops/bundle/init.sh (#1206): .env with generated secrets, config/keys, config/tls and the SIP
// port, from a POSIX shell and openssl alone, keeping everything on a second run.

const BUNDLE = path.join(__dirname, "..");
const INIT = path.join(BUNDLE, "init.sh");
const SECRET_NAME = /(_PASSWORD|_SECRET|_KEY|_TOKEN)$/;

/** A fresh install folder: the bundle's config/ and, when given, a pre-seeded .env. */
function folder(env?: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "init-sh-"));
  fs.cpSync(path.join(BUNDLE, "config"), path.join(dir, "config"), {
    recursive: true
  });
  if (env !== undefined) fs.writeFileSync(path.join(dir, ".env"), env);
  return dir;
}

function init(dir: string, args: string[] = [], env = process.env) {
  const r = spawnSync("sh", [INIT, "--dir", dir, ...args], {
    encoding: "utf8",
    env
  });
  return { status: r.status, out: r.stdout, err: r.stderr };
}

const mode = (p: string) => fs.statSync(p).mode & 0o777;
const read = (dir: string, p: string) =>
  fs.readFileSync(path.join(dir, p), "utf8");

/** Every file under config/keys and config/tls with its content. */
function secrets(dir: string): Record<string, string> {
  const out: Record<string, string> = { ".env": read(dir, ".env") };
  for (const sub of ["keys", "tls"]) {
    const d = path.join(dir, "config", sub);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) out[`${sub}/${f}`] = read(d, f);
  }
  return out;
}

/** A PATH with every tool of /usr/bin and /bin except the ones named. */
function pathWithout(...tools: string[]): string {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), "init-sh-bin-"));
  for (const d of ["/usr/bin", "/bin", "/usr/sbin", "/sbin"]) {
    if (!fs.existsSync(d)) continue;
    for (const t of fs.readdirSync(d)) {
      if (tools.includes(t) || fs.existsSync(path.join(bin, t))) continue;
      fs.symlinkSync(path.join(d, t), path.join(bin, t));
    }
  }
  return bin;
}

describe("@bundle init.sh", function () {
  this.timeout(60000);

  it("writes .env, keys, a verified certificate and the SIP port, printing no secret", function () {
    // Arrange
    const dir = folder("PUBLIC_URL=https://voice.example.com\n");

    // Act
    const r = init(dir, ["--host-ip", "203.0.113.10"]);

    // Assert
    expect(r.status, r.err).to.equal(0);
    expect(mode(path.join(dir, ".env"))).to.equal(0o600);
    const env = readEnvFile(path.join(dir, ".env"));
    expect(env.get("HOST_IP")).to.equal("203.0.113.10");
    expect(env.get("PUBLIC_URL")).to.equal("https://voice.example.com");
    expect(env.get("AUTOPILOT_SIGNING_SECRET")).to.match(/^[0-9a-f]{48}$/);
    expect(env.get("ENCRYPTION_KEY")).to.match(
      /^k1\.aesgcm256\.[A-Za-z0-9_-]{43}=$/
    );
    for (const name of [
      "POSTGRES_PASSWORD",
      "MINIO_ROOT_PASSWORD",
      "NATS_APISERVER_PASSWORD",
      "ROOMR_PASSWORD",
      "NATS_REGION_AGENT_PASSWORD",
      "FONOSTER_REGION_SECRETS_KEY"
    ])
      expect(env.get(name), name).to.match(/^s[0-9a-f]{32}$/);

    expect(mode(path.join(dir, "config"))).to.equal(0o700);
    const keys = path.join(dir, "config", "keys");
    for (const f of ["private.pem", "public.pem", "records.pem"])
      expect(mode(path.join(keys, f)), f).to.equal(0o644);
    expect(read(keys, "private.pem")).to.match(/^-----BEGIN PRIVATE KEY-----/);
    expect(read(keys, "records.pem")).to.match(/^-----BEGIN PRIVATE KEY-----/);
    expect(read(keys, "public.pem")).to.match(/^-----BEGIN PUBLIC KEY-----/);

    const tls = path.join(dir, "config", "tls");
    execFileSync("openssl", [
      "verify",
      "-CAfile",
      path.join(tls, "ca.pem"),
      path.join(tls, "server.pem")
    ]);
    const san = new X509Certificate(read(tls, "server.pem")).subjectAltName;
    for (const name of [
      "DNS:localhost",
      "IP Address:127.0.0.1",
      "IP Address:203.0.113.10",
      "DNS:voice.example.com"
    ])
      expect(san).to.contain(name);
    expect(mode(path.join(tls, "ca-key.pem"))).to.equal(0o600);

    const ports = parse(read(dir, "config/routr-edgeport.yaml"))
      .spec.transport.filter((t: { protocol: string }) =>
        ["tcp", "udp"].includes(t.protocol)
      )
      .map((t: { port: unknown }) => t.port);
    expect(ports).to.deep.equal([5060, 5060]);

    // A pre-seeded .env is kept: the template's other names are added to it.
    expect(r.out).to.match(/^\.env kept; added FONOSTER_VERSION, /);
    expect(r.out).to.contain(
      "docker compose exec -T apiserver fonoster-owner create you@example.com < owner.pw"
    );
    for (const [k, v] of env)
      if (SECRET_NAME.test(k) && v)
        expect(r.out + r.err, `prints ${k}`).to.not.contain(v);
    expect(fs.readdirSync(dir).sort()).to.deep.equal([".env", "config"]);
  });

  it("keeps .env, keys and certificates byte for byte on a second run", function () {
    // Arrange
    const dir = folder();
    const first = init(dir, ["--host-ip", "203.0.113.10"]);
    const before = secrets(dir);

    // Act
    const r = init(dir);

    // Assert
    expect(r.status, r.err).to.equal(0);
    expect(first.out).to.match(/^\.env written \(12 secrets generated\)\n/);
    expect(secrets(dir)).to.deep.equal(before);
    expect(r.out).to.contain(".env kept\n");
    expect(r.out).to.contain("keys: kept");
    expect(r.out).to.contain("tls: kept");
  });

  it("appends only the names a newer release adds, naming them", function () {
    // Arrange
    const dir = folder();
    init(dir, ["--host-ip", "203.0.113.10"]);
    const env = read(dir, ".env")
      .split("\n")
      .filter((l) => !/^(NATS_REGION_AGENT_PASSWORD|SIP_PORT)=/.test(l))
      .join("\n");
    fs.writeFileSync(path.join(dir, ".env"), env);

    // Act
    const r = init(dir);

    // Assert
    expect(r.status, r.err).to.equal(0);
    expect(r.out).to.contain(
      ".env kept; added SIP_PORT, NATS_REGION_AGENT_PASSWORD"
    );
    const after = read(dir, ".env");
    expect(after.startsWith(env)).to.equal(true);
    const added = after.slice(env.length).trim().split("\n");
    expect(added[0]).to.match(/^# Added by init\.sh/);
    expect(added.slice(1).map((l) => l.split("=")[0])).to.deep.equal([
      "SIP_PORT",
      "NATS_REGION_AGENT_PASSWORD"
    ]);
    expect(readEnvFile(path.join(dir, ".env")).get("SIP_PORT")).to.equal(
      "5060"
    );
  });

  it("generates NATS_BILLING_PASSWORD, and appends it to an older .env", function () {
    const dir = folder();
    init(dir, ["--host-ip", "203.0.113.10"]);
    const generated = readEnvFile(path.join(dir, ".env")).get(
      "NATS_BILLING_PASSWORD"
    );
    expect(generated).to.match(/^s[0-9a-f]{32}$/);
    const older = read(dir, ".env")
      .split("\n")
      .filter((l) => !/^NATS_BILLING_PASSWORD=/.test(l))
      .join("\n");
    fs.writeFileSync(path.join(dir, ".env"), older);

    const r = init(dir);

    expect(r.status, r.err).to.equal(0);
    expect(r.out).to.contain(".env kept; added NATS_BILLING_PASSWORD");
    expect(
      readEnvFile(path.join(dir, ".env")).get("NATS_BILLING_PASSWORD")
    ).to.match(/^s[0-9a-f]{32}$/);
  });

  it("fills an empty secret line of any name, and never regenerates one ending in =", function () {
    // Arrange
    const dir = folder(
      "MY_VENDOR_TOKEN=\nENCRYPTION_KEY=k1.aesgcm256.MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=\n"
    );

    // Act
    init(dir, ["--host-ip", "203.0.113.10"]);

    // Assert
    const env = readEnvFile(path.join(dir, ".env"));
    expect(env.get("MY_VENDOR_TOKEN")).to.match(/^s[0-9a-f]{32}$/);
    expect(env.get("ENCRYPTION_KEY")).to.equal(
      "k1.aesgcm256.MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="
    );
  });

  it("writes nothing under config/tls when TLS_CERT and TLS_KEY are set", function () {
    // Arrange
    const dir = folder(
      "TLS_CERT=/etc/letsencrypt/live/x/fullchain.pem\nTLS_KEY=/etc/letsencrypt/live/x/privkey.pem\n"
    );

    // Act
    const r = init(dir, ["--host-ip", "203.0.113.10"]);

    // Assert
    expect(r.status, r.err).to.equal(0);
    expect(fs.existsSync(path.join(dir, "config", "tls"))).to.equal(false);
    expect(r.out).to.contain("tls: using TLS_CERT and TLS_KEY");
    expect(r.out).to.not.contain("Certificate ");
  });

  it("reissues the server certificate when a name changes and keeps the CA", function () {
    // Arrange
    const dir = folder();
    init(dir, ["--host-ip", "203.0.113.10"]);
    const ca = read(dir, "config/tls/ca.pem");

    // Act
    const r = init(dir, ["--host-ip", "203.0.113.20"]);

    // Assert
    expect(r.status, r.err).to.equal(0);
    expect(r.out).to.contain("tls: server certificate reissued");
    expect(read(dir, "config/tls/ca.pem")).to.equal(ca);
    expect(
      new X509Certificate(read(dir, "config/tls/server.pem")).subjectAltName
    ).to.contain("IP Address:203.0.113.20");
    expect(readEnvFile(path.join(dir, ".env")).get("HOST_IP")).to.equal(
      "203.0.113.20"
    );
  });

  it("sets the SIP port in a merged, re-serialised routr-edgeport.yaml", function () {
    // Arrange: keys sorted, list items at the key's indent, no comments (to_nice_yaml).
    const dir = folder("SIP_PORT=15060\n");
    fs.writeFileSync(
      path.join(dir, "config", "routr-edgeport.yaml"),
      [
        "apiVersion: v2beta1",
        "kind: EdgePort",
        "spec:",
        "  transport:",
        "  - port: 5060",
        "    protocol: tcp",
        "  - port: 5060",
        "    protocol: udp",
        "  - port: 5062",
        "    protocol: ws",
        "  unknownMethodAction: Discard",
        ""
      ].join("\n")
    );

    // Act
    init(dir, ["--host-ip", "203.0.113.10"]);
    const once = read(dir, "config/routr-edgeport.yaml");
    init(dir);

    // Assert
    const spec = parse(once).spec;
    expect(spec.transport).to.deep.equal([
      { port: 15060, protocol: "tcp" },
      { port: 15060, protocol: "udp" },
      { port: 5062, protocol: "ws" }
    ]);
    expect(spec.unknownMethodAction).to.equal("Discard");
    expect(read(dir, "config/routr-edgeport.yaml")).to.equal(once);
  });

  it("exits 1 naming the problem: bad --host-ip, no address found, no config/, no openssl", function () {
    const dir = folder();
    const bad = init(dir, ["--host-ip", "not an address"]);
    expect(bad.status).to.equal(1);
    expect(bad.err).to.equal(
      'init: --host-ip "not an address" is not an address\n'
    );

    const noIp = init(dir, [], {
      ...process.env,
      PATH: pathWithout("ip", "ipconfig", "route", "hostname")
    });
    expect(noIp.status).to.equal(1);
    expect(noIp.err).to.equal(
      "init: could not find this machine's address: pass --host-ip\n"
    );

    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "init-sh-"));
    const noConfig = init(empty, ["--host-ip", "203.0.113.10"]);
    expect(noConfig.status).to.equal(1);
    expect(noConfig.err).to.contain("init: no config/ folder in");

    const noSsl = init(dir, ["--host-ip", "203.0.113.10"], {
      ...process.env,
      PATH: pathWithout("openssl")
    });
    expect(noSsl.status).to.equal(1);
    expect(noSsl.err).to.match(
      /^init: openssl not found\..*Nothing was written\.\n$/
    );
    expect(fs.existsSync(path.join(dir, ".env"))).to.equal(false);

    expect(init(dir, ["--bogus"]).status).to.equal(2);
  });
});
