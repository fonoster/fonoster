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
import { createPrivateKey, createPublicKey, X509Certificate } from "crypto";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { suggestKey } from "../../../src/config/configHints";
import { expandEnv, readEnvFile } from "../../../src/config/cli/envFile";
import { interpolateEnv } from "../../../src/config/interpolateEnv";
import { main } from "../../../src/config/cli/main";
import {
  deepMerge,
  renderConfigDir,
  RenderError,
  renderTemplate
} from "../../../src/config/cli/render";
import { encryptionKey, generateSecret } from "../../../src/config/cli/secrets";
import { runInit } from "../../../src/config/cli/init";
import { ensureLocalTls } from "../../../src/config/cli/tls";
import {
  exposureWarnings,
  isLocalHost
} from "../../../src/config/cli/exposure";
import { Io } from "../../../src/config/cli/types";
import { exportConfigSchemas } from "../../../scripts/export-config-schemas";

const BUNDLE = join(__dirname, "../../../../../ops/bundle");

type Run = { code: number; out: string; err: string };

function capture(): Io & { out_: string[]; err_: string[] } {
  const out_: string[] = [];
  const err_: string[] = [];
  return {
    out_,
    err_,
    out: (l) => out_.push(l),
    err: (l) => err_.push(l)
  };
}

async function cli(args: string[]): Promise<Run> {
  const io = capture();
  const code = await main(args, io);
  return { code, out: io.out_.join("\n"), err: io.err_.join("\n") };
}

/** A freshly unpacked bundle in a temporary folder. */
function unpack(): string {
  const dir = join(mkdtempSync(join(tmpdir(), "fonoster-bundle-")), "fonoster");
  cpSync(BUNDLE, dir, { recursive: true });
  return dir;
}

async function init(dir: string, hostIp = "192.0.2.10"): Promise<Run> {
  const io = capture();
  const code = await runInit(
    { dir, detectHostIp: async () => hostIp || undefined },
    io
  );
  return { code, out: io.out_.join("\n"), err: io.err_.join("\n") };
}

const yamlOf = (dir: string, name: string) =>
  parse(readFileSync(join(dir, "config", name), "utf8"));
const mode = (path: string) => statSync(path).mode & 0o777;

/** A JSON Schema that accepts exactly the shape of a rendered file (stand-in for D5's). */
function shapeSchema(value: unknown): object {
  if (Array.isArray(value))
    return { type: "array", items: value.length ? shapeSchema(value[0]) : {} };
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as object);
    return {
      type: "object",
      properties: Object.fromEntries(
        entries.map(([k, v]) => [k, shapeSchema(v)])
      ),
      required: entries.map(([k]) => k),
      additionalProperties: false
    };
  }
  return {};
}

function writeSchemas(dir: string) {
  const schemas = join(dir, "config", "schemas");
  mkdirSync(schemas, { recursive: true });
  for (const name of ["fonoster", "appbridge", "autopilot", "routr-edgeport"]) {
    const schema = shapeSchema(yamlOf(dir, `${name}.yaml`)) as {
      properties: Record<string, object>;
      required: string[];
    };
    if (name === "appbridge") schema.properties.turnTaking = { type: "object" };
    writeFileSync(join(schemas, `${name}.json`), JSON.stringify(schema));
  }
}

describe("@common[config/cli] fonoster-config", function () {
  this.timeout(30000);

  describe("init", function () {
    it("prepares a fresh folder without prompts and prints the next step", async function () {
      const dir = unpack();
      const run = await init(dir);
      expect(run.code, run.err).to.equal(0);
      expect(run.out).to.contain("docker compose up -d");
      for (const f of [
        ".env",
        "config/fonoster.yaml",
        "config/appbridge.yaml",
        "config/autopilot.yaml",
        "config/roomr.yaml",
        "config/routr-edgeport.yaml",
        "config/keys/private.pem",
        "config/keys/public.pem",
        "config/keys/records.pem"
      ])
        expect(existsSync(join(dir, f)), f).to.equal(true);
      // Hosting private regions is a manual addition: init writes no region hub.
      for (const f of [
        "config/region-hub.conf",
        "config/keys/region-operator.key",
        "config/keys/region-signing.pem"
      ])
        expect(existsSync(join(dir, f)), f).to.equal(false);
      // The examples stay for reference.
      expect(existsSync(join(dir, "config/fonoster.example.yaml"))).to.equal(
        true
      );
    });

    it("generates every secret with Node crypto in the expected formats", async function () {
      const dir = unpack();
      await init(dir);
      const env = readEnvFile(join(dir, ".env"));
      for (const name of [
        "POSTGRES_PASSWORD",
        "MINIO_ROOT_PASSWORD",
        "NATS_APISERVER_PASSWORD",
        "NATS_APPBRIDGE_PASSWORD",
        "NATS_ROOMR_PASSWORD",
        "NATS_ROUTR_PASSWORD",
        "AUTOPILOT_SIGNING_SECRET",
        "ROOMR_PASSWORD",
        "OWNER_PASSWORD",
        "ENCRYPTION_KEY"
      ])
        expect(env.get(name), name).to.have.length.greaterThan(15);
      for (const svc of ["APISERVER", "APPBRIDGE", "ROOMR", "ROUTR"])
        expect(env.get(`NATS_${svc}_PASSWORD`)).to.match(/^[a-z][0-9a-f]+$/);
      expect(env.get("ENCRYPTION_KEY")).to.match(
        /^k1\.aesgcm256\.[A-Za-z0-9_-]{43}=$/
      );
      expect(
        Buffer.from(env.get("ENCRYPTION_KEY")!.slice(13), "base64url")
      ).to.have.length(32);
      expect(env.get("HOST_IP")).to.equal("192.0.2.10");

      const keys = join(dir, "config/keys");
      const rsa = createPrivateKey(readFileSync(join(keys, "private.pem")));
      expect(rsa.asymmetricKeyType).to.equal("rsa");
      expect(
        createPublicKey(readFileSync(join(keys, "public.pem"))).export({
          format: "jwk"
        }).n
      ).to.equal(createPublicKey(rsa).export({ format: "jwk" }).n);
      const ec = createPrivateKey(readFileSync(join(keys, "records.pem")));
      expect(ec.asymmetricKeyDetails?.namedCurve).to.equal("prime256v1");
    });

    it("writes .env for the owner only and keys the containers read world-readable", async function () {
      const dir = unpack();
      await init(dir);
      expect(mode(join(dir, ".env"))).to.equal(0o600);
      expect(mode(join(dir, "config"))).to.equal(0o700);
      for (const f of [
        "config/fonoster.yaml",
        "config/appbridge.yaml",
        "config/keys/private.pem",
        "config/keys/records.pem"
      ])
        expect(mode(join(dir, f)), f).to.equal(0o644);
    });

    it("keeps secrets in .env: service files hold placeholders, Routr's gets values", async function () {
      const dir = unpack();
      await init(dir);
      const env = Object.fromEntries(readEnvFile(join(dir, ".env")));
      const fonoster = yamlOf(dir, "fonoster.yaml");
      expect(fonoster.database.url).to.equal(
        "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/fonoster"
      );
      expect(fonoster.encryption.key).to.equal("${ENCRYPTION_KEY}");
      expect(yamlOf(dir, "appbridge.yaml").encryption.key).to.equal(
        "${ENCRYPTION_KEY}"
      );
      expect(yamlOf(dir, "autopilot.yaml").encryption.key).to.equal(
        "${ENCRYPTION_KEY}"
      );
      // What the services resolve, from the environment Compose passes (.env).
      const resolved = interpolateEnv(
        fonoster,
        expandEnv(new Map(Object.entries(env)))
      );
      expect(resolved.database.url).to.equal(
        `postgresql://postgres:${env.POSTGRES_PASSWORD}@postgres:5432/fonoster`
      );
      expect(resolved.appUrl).to.equal("http://192.0.2.10:8449");
      expect(resolved.regions.public[0].endpoints.sip[0]).to.deep.equal({
        host: "192.0.2.10",
        port: "5060",
        transport: "udp"
      });
      expect(fonoster.catalog).to.deep.equal({
        file: "/etc/fonoster/catalog.yaml"
      });
      // No private-region settings or ClickHouse by default.
      expect(fonoster.regions.hub).to.equal(undefined);
      expect(fonoster.regions.operatorKey).to.equal(undefined);
      expect(yamlOf(dir, "appbridge.yaml").callRecord.analytics).to.equal(
        undefined
      );
      // Routr can't resolve placeholders: its file gets the values (no secrets in it).
      expect(
        yamlOf(dir, "routr-edgeport.yaml").spec.transport[0].port
      ).to.equal(5060);
      // Browser calls (add-talk-in-browser): SIP over WebSocket behind Envoy's /sip, on appUrl's
      // origin (no signalingServer: ws:// or wss:// follows PUBLIC_URL), test tokens checked with
      // Identity's public key.
      expect(resolved.signalingServer).to.equal(undefined);
      expect(yamlOf(dir, "routr-edgeport.yaml").spec.transport).to.deep.include(
        { protocol: "ws", port: 5062 }
      );
      expect(yamlOf(dir, "appbridge.yaml").testCalls).to.deep.equal({
        publicKeyFile: "/etc/fonoster/keys/public.pem"
      });
      expect(readFileSync(join(dir, "config", "envoy.yaml"), "utf8")).to.match(
        /prefix: "\/sip"[\s\S]*upgrade_type: websocket/
      );
      const secrets = Object.entries(env).filter(
        ([k, v]) => /(_PASSWORD|_SECRET|_KEY)$/.test(k) && v.length > 8
      );
      expect(secrets.length).to.be.greaterThan(8);
      for (const f of [
        "fonoster.yaml",
        "appbridge.yaml",
        "autopilot.yaml",
        "roomr.yaml",
        "routr-edgeport.yaml"
      ]) {
        const text = readFileSync(join(dir, "config", f), "utf8");
        for (const [name, value] of secrets)
          expect(text, `${f} holds ${name}`).to.not.contain(value);
      }
    });

    it("advertises the --host-ip address instead of the detected one", async function () {
      const dir = unpack();
      const run = await cli([
        "init",
        "--dir",
        dir,
        "--host-ip",
        "203.0.113.10"
      ]);
      expect(run.code, run.err).to.equal(0);
      expect(readEnvFile(join(dir, ".env")).get("HOST_IP")).to.equal(
        "203.0.113.10"
      );
      const env = expandEnv(readEnvFile(join(dir, ".env")));
      const fonoster = interpolateEnv(yamlOf(dir, "fonoster.yaml"), env);
      expect(
        fonoster.regions.public[0].endpoints.signalingAddresses
      ).to.deep.equal(["203.0.113.10"]);
      expect(fonoster.regions.public[0].endpoints.mediaAddresses).to.deep.equal(
        ["203.0.113.10"]
      );
      expect(fonoster.appUrl).to.equal("http://203.0.113.10:8449");
    });

    it("exits non-zero and asks for --host-ip when no address is found", async function () {
      const dir = unpack();
      const run = await init(dir, "");
      expect(run.code).to.not.equal(0);
      expect(run.err).to.contain("--host-ip");
      expect(existsSync(join(dir, ".env"))).to.equal(false);
    });

    it("refuses a folder that is not a bundle", async function () {
      const run = await cli([
        "init",
        "--dir",
        mkdtempSync(join(tmpdir(), "empty-"))
      ]);
      expect(run.code).to.equal(1);
      expect(run.err).to.contain("unpacked fonoster folder");
    });

    it("keeps every secret and key byte for byte on a second run, and the owner's edits", async function () {
      const dir = unpack();
      await init(dir);
      const envFile = join(dir, ".env");
      // The owner changes a port and adds a line of their own.
      writeFileSync(
        envFile,
        readFileSync(envFile, "utf8").replace(
          /^SIP_PORT=5060$/m,
          "SIP_PORT=5080"
        ) + "# mine\nMY_SETTING=1\n"
      );
      const files = [
        ".env",
        "config/keys/private.pem",
        "config/keys/public.pem",
        "config/keys/records.pem"
      ];
      const before = files.map((f) => readFileSync(join(dir, f)));
      const run = await init(dir, "198.51.100.7");
      expect(run.code, run.err).to.equal(0);
      expect(run.out).to.contain(".env kept");
      files.forEach((f, i) =>
        expect(readFileSync(join(dir, f)).equals(before[i]), f).to.equal(true)
      );
      // The kept address wins over a newly detected one; the edit is rendered.
      expect(
        yamlOf(dir, "routr-edgeport.yaml").spec.transport[0].port
      ).to.equal(5080);
      expect(readEnvFile(envFile).get("HOST_IP")).to.equal("192.0.2.10");
    });

    it("merges config/overrides over every render, so a second run keeps the owner's keys", async function () {
      const dir = unpack();
      await init(dir);
      expect(
        existsSync(join(dir, "config/overrides")),
        "overrides folder"
      ).to.equal(true);
      writeFileSync(
        join(dir, "config/overrides/appbridge.yaml"),
        'providers:\n  deepgram:\n    credential:\n      value: "dg_live_4f1c9a"\n'
      );
      const run = await init(dir);
      expect(run.code, run.err).to.equal(0);
      const appbridge = yamlOf(dir, "appbridge.yaml");
      expect(appbridge.providers.deepgram.credential.value).to.equal(
        "dg_live_4f1c9a"
      );
      // The rest of the file still comes from the example.
      expect(appbridge.providers.deepgram.adapter).to.equal("deepgram");
      expect(appbridge.providers.elevenlabs.credential.value).to.equal(
        "YOUR_ELEVENLABS_API_KEY"
      );
    });

    it("generates only a secret a newer bundle adds and appends it", async function () {
      const dir = unpack();
      await init(dir);
      const envFile = join(dir, ".env");
      const before = readFileSync(envFile, "utf8");
      appendFileSync(
        join(dir, ".env.example"),
        "NEW_SERVICE_PASSWORD=\nNEW_PORT=7000\n"
      );
      const run = await init(dir);
      expect(run.code, run.err).to.equal(0);
      expect(run.out).to.contain("added NEW_SERVICE_PASSWORD, NEW_PORT");
      const after = readFileSync(envFile, "utf8");
      expect(after.startsWith(before)).to.equal(true);
      const added = after.slice(before.length).trim().split("\n");
      expect(added[0]).to.match(/^# Added by fonoster-config init/);
      expect(added[1]).to.match(/^NEW_SERVICE_PASSWORD=s[0-9a-f]{32}$/);
      expect(added[2]).to.equal("NEW_PORT=7000");
      expect(added).to.have.length(3);
    });

    it("says nothing about rebuilds, in files or output", async function () {
      const dir = unpack();
      const run = await init(dir);
      const info = await cli(["info", "--dir", dir]);
      const check = await cli(["check", "--dir", dir]);
      for (const text of [run.out, run.err, info.out, check.out, check.err])
        expect(text).to.not.match(/rebuild|RB_/i);
    });
  });

  describe("HTTPS (M10)", function () {
    /** A certificate and key path that exist (contents don't matter to the warnings). */
    function certFiles(dir: string) {
      const cert = join(dir, "fullchain.pem");
      const key = join(dir, "privkey.pem");
      writeFileSync(cert, "cert");
      writeFileSync(key, "key");
      return { cert, key };
    }

    it("warns when PUBLIC_URL is plain HTTP on an address others may reach", async function () {
      const dir = unpack();
      const run = await init(dir, "203.0.113.10");
      expect(run.code, run.err).to.equal(0);
      expect(run.err).to.contain(
        "warning: PUBLIC_URL is http://203.0.113.10:8449: the dashboard and API"
      );
      expect(run.err).to.contain("compose.tls.yaml");
      const check = await cli(["check", "--dir", dir]);
      expect(check.code, check.err).to.equal(0);
      expect(check.err).to.contain("warning: PUBLIC_URL is http://");
    });

    it("says nothing for a local or private address, or an https:// PUBLIC_URL", async function () {
      for (const host of ["10.1.2.3", "192.168.1.20", "127.0.0.1"]) {
        const run = await init(unpack(), host);
        expect(run.code, run.err).to.equal(0);
        expect(run.err, host).to.not.contain("warning");
      }
      // A TLS proxy in front (HTTP_BIND=127.0.0.1), Envoy on plain HTTP behind it.
      const dir = unpack();
      await init(dir, "203.0.113.10");
      appendFileSync(
        join(dir, ".env"),
        "HTTP_BIND=127.0.0.1\nPUBLIC_URL=https://voice.example.com\n"
      );
      const run = await init(dir);
      expect(run.err).to.not.contain("warning");
    });

    it("accepts a complete HTTPS setup and prints the HTTPS address", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      const { cert, key } = certFiles(dir);
      appendFileSync(
        join(dir, ".env"),
        [
          "COMPOSE_FILE=compose.yaml:compose.tls.yaml",
          "PUBLIC_URL=https://voice.example.com",
          `TLS_CERT=${cert}`,
          `TLS_KEY=${key}`,
          ""
        ].join("\n")
      );
      const run = await init(dir);
      expect(run.code, run.err).to.equal(0);
      expect(run.err).to.not.contain("warning");
      const info = await cli(["info", "--dir", dir]);
      expect(info.out).to.contain("Dashboard   https://voice.example.com");
      expect(info.out).to.contain(
        "voice.example.com:443 (gRPC and gRPC-Web, TLS)"
      );
      expect(info.out).to.not.contain("plain HTTP");
    });

    it("warns about an incomplete HTTPS setup without failing", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      appendFileSync(
        join(dir, ".env"),
        "COMPOSE_FILE=compose.yaml:compose.tls.yaml\nTLS_CERT=missing/fullchain.pem\n"
      );
      const run = await init(dir);
      expect(run.code, run.err).to.equal(0);
      expect(run.err).to.contain("TLS_CERT: missing/fullchain.pem not found");
      expect(run.err).to.contain("TLS_KEY is not set");
      expect(run.err).to.contain("PUBLIC_URL is http://");

      // A certificate without compose.tls.yaml does nothing.
      expect(
        exposureWarnings(
          { PUBLIC_URL: "http://localhost:8449", TLS_CERT: "x" },
          dir
        )
      ).to.deep.equal([
        "TLS_CERT/TLS_KEY are set but COMPOSE_FILE does not name compose.tls.yaml: Envoy still serves plain HTTP"
      ]);
    });

    it("treats loopback, private and .local hosts as local", function () {
      for (const h of [
        "localhost",
        "app.localhost",
        "fonoster.local",
        "127.0.0.1",
        "10.0.0.1",
        "172.20.0.1",
        "192.168.0.10",
        "::1",
        "[fd00::1]"
      ])
        expect(isLocalHost(h), h).to.equal(true);
      for (const h of [
        "203.0.113.10",
        "8.8.8.8",
        "172.32.0.1",
        "voice.example.com",
        "2001:db8::1"
      ])
        expect(isLocalHost(h), h).to.equal(false);
    });
  });

  describe("generated certificate (https-by-default)", function () {
    const TLS_FILES = ["ca.pem", "ca-key.pem", "server.pem", "server-key.pem"];
    const tlsFile = (dir: string, f: string) => join(dir, "config/tls", f);
    const certOf = (dir: string, f: string) =>
      new X509Certificate(readFileSync(tlsFile(dir, f)));
    const days = (from: string, to: string) =>
      Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

    it("creates a local CA and a server certificate for the install's names", async function () {
      const dir = unpack();
      const run = await init(dir, "203.0.113.10");
      expect(run.code, run.err).to.equal(0);
      expect(run.out).to.contain(
        "tls: local CA and server certificate created in config/tls"
      );
      expect(run.out).to.contain("(for getting started)");
      for (const f of TLS_FILES)
        expect(existsSync(tlsFile(dir, f)), f).to.equal(true);
      expect(mode(tlsFile(dir, "ca-key.pem"))).to.equal(0o600);
      expect(mode(tlsFile(dir, "server-key.pem"))).to.equal(0o600);
      expect(mode(tlsFile(dir, "ca.pem"))).to.equal(0o644);
      expect(mode(tlsFile(dir, "server.pem"))).to.equal(0o644);

      const ca = certOf(dir, "ca.pem");
      const server = certOf(dir, "server.pem");
      expect(ca.ca).to.equal(true);
      expect(server.ca).to.equal(false);
      expect(server.checkIssued(ca)).to.equal(true);
      expect(server.verify(ca.publicKey)).to.equal(true);
      expect(days(ca.validFrom, ca.validTo)).to.be.within(3650, 3651);
      expect(days(server.validFrom, server.validTo)).to.be.within(397, 398);
      // Default PUBLIC_URL is http://${HOST_IP}:8449: its host is the host address.
      for (const name of ["localhost", "127.0.0.1", "203.0.113.10"])
        expect(server.checkHost(name) || server.checkIP(name), name).to.be.ok;
      expect(server.checkHost("voice.example.com")).to.equal(undefined);
      // ECDSA P-256, signed ecdsa-with-SHA256 by Node's crypto (no certificate library).
      expect(ca.publicKey.asymmetricKeyType).to.equal("ec");
      expect(ca.publicKey.asymmetricKeyDetails?.namedCurve).to.equal(
        "prime256v1"
      );
      expect(ca.verify(ca.publicKey)).to.equal(true);
      expect(ca.subject).to.equal("CN=Fonoster local CA");
      expect(server.issuer).to.equal(ca.subject);
      expect(server.subjectAltName).to.equal(
        "DNS:localhost, IP Address:127.0.0.1, IP Address:203.0.113.10"
      );
      expect(server.keyUsage).to.deep.equal(["1.3.6.1.5.5.7.3.1"]);
    });

    it("writes certificates openssl verifies, with the expected extensions", async function () {
      if (spawnSync("openssl", ["version"]).status !== 0) this.skip();
      const dir = unpack();
      await init(dir, "203.0.113.10");
      const ca = tlsFile(dir, "ca.pem");
      const server = tlsFile(dir, "server.pem");
      const verify = spawnSync("openssl", ["verify", "-CAfile", ca, server], {
        encoding: "utf8"
      });
      expect(verify.status, verify.stderr).to.equal(0);
      expect(verify.stdout).to.contain(": OK");
      const text = (file: string) =>
        spawnSync("openssl", ["x509", "-in", file, "-noout", "-text"], {
          encoding: "utf8"
        }).stdout;
      const caText = text(ca);
      expect(caText).to.match(/Basic Constraints: critical\s+CA:TRUE/);
      expect(caText).to.match(
        /Key Usage: critical\s+Certificate Sign, CRL Sign/
      );
      expect(caText).to.contain("Subject Key Identifier");
      const serverText = text(server);
      expect(serverText).to.match(/Basic Constraints: critical\s+CA:FALSE/);
      expect(serverText).to.match(/Key Usage: critical\s+Digital Signature/);
      expect(serverText).to.contain("TLS Web Server Authentication");
      expect(serverText).to.contain("Authority Key Identifier");
      expect(serverText).to.contain("ecdsa-with-SHA256");
    });

    it("keeps every file byte for byte on a second run", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      const before = TLS_FILES.map((f) => readFileSync(tlsFile(dir, f)));
      const run = await init(dir);
      expect(run.code, run.err).to.equal(0);
      expect(run.out).to.contain("tls: kept (config/tls)");
      TLS_FILES.forEach((f, i) =>
        expect(readFileSync(tlsFile(dir, f)).equals(before[i]), f).to.equal(
          true
        )
      );
    });

    it("reissues only the server certificate for a new PUBLIC_URL host, keeping the CA", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      const ca = readFileSync(tlsFile(dir, "ca.pem"));
      const caKey = readFileSync(tlsFile(dir, "ca-key.pem"));
      appendFileSync(
        join(dir, ".env"),
        "PUBLIC_URL=https://voice.example.com\n"
      );
      const run = await init(dir);
      expect(run.out).to.contain("tls: server certificate reissued");
      expect(run.out).to.contain("voice.example.com");
      expect(readFileSync(tlsFile(dir, "ca.pem")).equals(ca)).to.equal(true);
      expect(readFileSync(tlsFile(dir, "ca-key.pem")).equals(caKey)).to.equal(
        true
      );
      const server = certOf(dir, "server.pem");
      expect(server.checkHost("voice.example.com")).to.equal(
        "voice.example.com"
      );
      expect(server.checkIssued(certOf(dir, "ca.pem"))).to.equal(true);
    });

    it("reissues the server certificate within 30 days of expiry", function () {
      const dir = unpack();
      const env = { HOST_IP: "192.0.2.10" };
      expect(ensureLocalTls(dir, env).state).to.equal("created");
      const later = (d: number) => new Date(Date.now() + d * 86_400_000);
      expect(ensureLocalTls(dir, env, later(300)).state).to.equal("kept");
      expect(ensureLocalTls(dir, env, later(370)).state).to.equal("reissued");
    });

    it("generates nothing when .env names the owner's certificate", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      rmSync(join(dir, "config/tls"), { recursive: true });
      const cert = join(dir, "fullchain.pem");
      const key = join(dir, "privkey.pem");
      writeFileSync(cert, "cert");
      writeFileSync(key, "key");
      appendFileSync(join(dir, ".env"), `TLS_CERT=${cert}\nTLS_KEY=${key}\n`);
      const run = await init(dir);
      expect(run.code, run.err).to.equal(0);
      expect(run.out).to.contain("tls: using TLS_CERT and TLS_KEY");
      expect(existsSync(join(dir, "config/tls"))).to.equal(false);
    });

    it("keeps maintaining the generated files when TLS_CERT and TLS_KEY point at them", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      appendFileSync(
        join(dir, ".env"),
        "TLS_CERT=./config/tls/server.pem\nTLS_KEY=./config/tls/server-key.pem\n"
      );
      const run = await init(dir);
      expect(run.out).to.contain("tls: kept (config/tls)");
    });

    it("info shows the CA file, its fingerprint and the getting-started notice when HTTPS uses it", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      let info = await cli(["info", "--dir", dir]);
      // HTTPS is not on yet: the files are listed, with no notice.
      expect(info.out).to.contain("certificate generated for getting started");
      expect(info.out).to.not.contain("SHA-256");
      appendFileSync(
        join(dir, ".env"),
        [
          "COMPOSE_FILE=compose.yaml:compose.tls.yaml",
          "PUBLIC_URL=https://203.0.113.10",
          "TLS_CERT=./config/tls/server.pem",
          "TLS_KEY=./config/tls/server-key.pem",
          ""
        ].join("\n")
      );
      await init(dir);
      info = await cli(["info", "--dir", dir]);
      expect(info.code, info.err).to.equal(0);
      expect(info.out).to.contain(`Certificate ${tlsFile(dir, "ca.pem")}`);
      expect(info.out).to.contain(
        `SHA-256 ${certOf(dir, "ca.pem").fingerprint256}`
      );
      expect(info.out).to.contain("Use a real certificate");
    });

    it("info shows no notice with the owner's certificate", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      const cert = join(dir, "fullchain.pem");
      const key = join(dir, "privkey.pem");
      writeFileSync(cert, "cert");
      writeFileSync(key, "key");
      appendFileSync(
        join(dir, ".env"),
        `COMPOSE_FILE=compose.yaml:compose.tls.yaml\nPUBLIC_URL=https://voice.example.com\nTLS_CERT=${cert}\nTLS_KEY=${key}\n`
      );
      const info = await cli(["info", "--dir", dir]);
      expect(info.out).to.not.contain("getting started");
      expect(info.out).to.not.contain("SHA-256");
    });

    it("check warns when a public domain is served with the generated certificate", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      appendFileSync(
        join(dir, ".env"),
        [
          "COMPOSE_FILE=compose.yaml:compose.tls.yaml",
          "PUBLIC_URL=https://voice.example.com",
          "TLS_CERT=./config/tls/server.pem",
          "TLS_KEY=./config/tls/server-key.pem",
          ""
        ].join("\n")
      );
      await init(dir);
      const check = await cli(["check", "--dir", dir]);
      expect(check.code, check.err).to.equal(0);
      expect(check.err).to.contain(
        "warning: PUBLIC_URL is https://voice.example.com but HTTPS uses the certificate init generated for getting started"
      );
    });

    it("check says nothing for the generated certificate on an IP address", async function () {
      const dir = unpack();
      await init(dir, "203.0.113.10");
      appendFileSync(
        join(dir, ".env"),
        [
          "COMPOSE_FILE=compose.yaml:compose.tls.yaml",
          "PUBLIC_URL=https://203.0.113.10",
          "TLS_CERT=./config/tls/server.pem",
          "TLS_KEY=./config/tls/server-key.pem",
          ""
        ].join("\n")
      );
      await init(dir);
      const check = await cli(["check", "--dir", dir]);
      expect(check.err).to.not.contain("warning");
    });

    it("never ships config/tls in the release archive", function () {
      const script = readFileSync(join(BUNDLE, "../release/bundle"), "utf8");
      expect(script).to.match(/rm -rf [^\n]*"\$STAGE\/config\/tls"/);
    });
  });

  describe("info", function () {
    it("prints the dashboard URL, the owner login and the SIP address after init", async function () {
      const dir = unpack();
      await init(dir);
      const env = readEnvFile(join(dir, ".env"));
      const run = await cli(["info", "--dir", dir]);
      expect(run.code).to.equal(0);
      expect(run.out).to.contain("http://192.0.2.10:8449");
      expect(run.out).to.contain(
        `admin@fonoster.local / ${env.get("OWNER_PASSWORD")}`
      );
      expect(run.out).to.contain("192.0.2.10:5060 (UDP and TCP)");
      expect(run.out).to.contain(join(dir, ".env"));
      expect(run.out).to.contain(join(dir, "config", "keys"));
    });

    it("exits non-zero before init and says to run init", async function () {
      const run = await cli(["info", "--dir", unpack()]);
      expect(run.code).to.equal(1);
      expect(run.err).to.contain("init");
    });
  });

  describe("check", function () {
    it("reports every service as valid right after init", async function () {
      const dir = unpack();
      await init(dir);
      writeSchemas(dir);
      const run = await cli(["check", "--dir", dir]);
      expect(run.code, run.err).to.equal(0);
      for (const f of ["fonoster", "appbridge", "autopilot", "routr-edgeport"])
        expect(run.out).to.contain(`config/${f}.yaml: valid`);
    });

    it("warns about a platform key named after no language-model provider in the catalog", async function () {
      const dir = unpack();
      await init(dir);
      writeSchemas(dir);
      const clean = await cli(["check", "--dir", dir]);
      expect(clean.err).to.not.contain("credentials.");
      writeFileSync(
        join(dir, "config/overrides/autopilot.yaml"),
        'credentials:\n  openai-default:\n    value: "sk-4f1c9a"\n'
      );
      await init(dir);
      writeSchemas(dir);
      const run = await cli(["check", "--dir", dir]);
      expect(run.code, run.err).to.equal(0);
      expect(run.err).to.contain(
        "warning: config/autopilot.yaml: credentials.openai-default matches no language-model provider"
      );
      expect(run.err).to.contain("(the catalog's names: openai, groq)");
    });

    it("validates against the schemas the bundle ships (exportConfigSchemas)", async function () {
      const dir = unpack();
      await init(dir);
      await exportConfigSchemas(join(dir, "config", "schemas"));
      const ok = await cli(["check", "--dir", dir]);
      expect(ok.code, ok.err).to.equal(0);
      expect(ok.out).to.contain("config/appbridge.yaml: valid");
      appendFileSync(
        join(dir, "config/appbridge.yaml"),
        "turnTakng: { mode: auto }\n"
      );
      const bad = await cli(["check", "--dir", dir]);
      expect(bad.code).to.equal(1);
      expect(bad.err).to.contain("config/appbridge.yaml: turnTakng");
    });

    it("prints no Ajv format warnings (formats are documentation only)", async function () {
      const dir = unpack();
      await init(dir);
      await exportConfigSchemas(join(dir, "config", "schemas"));
      const printed: string[] = [];
      const saved = {
        warn: console.warn,
        log: console.log,
        error: console.error
      };
      for (const k of ["warn", "log", "error"] as const)
        console[k] = (...a: unknown[]) => printed.push(a.join(" "));
      let run: Run;
      try {
        run = await cli(["check", "--dir", dir]);
      } finally {
        Object.assign(console, saved);
      }
      expect(run.code, run.err).to.equal(0);
      for (const text of [run.out, run.err, ...printed])
        expect(text).to.not.contain("unknown format");
    });

    it("names the file and an unknown key, suggests the right one and fails", async function () {
      const dir = unpack();
      await init(dir);
      writeSchemas(dir);
      appendFileSync(
        join(dir, "config/appbridge.yaml"),
        "turnTakng: { mode: auto }\n"
      );
      const run = await cli(["check", "--dir", dir]);
      expect(run.code).to.equal(1);
      expect(run.err).to.contain(
        "config/appbridge.yaml: turnTakng: unknown key (did you mean turnTaking?)"
      );
    });

    it("reports missing values with their key path", async function () {
      const dir = unpack();
      await init(dir);
      writeSchemas(dir);
      const file = join(dir, "config/autopilot.yaml");
      writeFileSync(
        file,
        readFileSync(file, "utf8").replace(/^port: 3000\n/m, "")
      );
      const run = await cli(["check", "--dir", dir]);
      expect(run.code).to.equal(1);
      expect(run.err).to.contain(
        "config/autopilot.yaml: port: missing required value"
      );
    });

    it("resolves secret:// references without printing values, and reports bad ones", async function () {
      const dir = unpack();
      await init(dir);
      const env = readEnvFile(join(dir, ".env"));
      expect((await cli(["check", "--dir", dir])).code).to.equal(0);
      const file = join(dir, "config/appbridge.yaml");
      writeFileSync(
        file,
        readFileSync(file, "utf8")
          .replace(
            'password: "${NATS_APPBRIDGE_PASSWORD}"',
            'password: "secret://env/NATS_APPBRIDGE_PASSWORD"'
          )
          .replace(
            'encryption: { key: "${ENCRYPTION_KEY}" }',
            'encryption: { key: "secret://vault/x" }'
          ) +
          'extra: "secret://env/NOT_IN_ENV"\nother: "secret://file/opt/fonoster/keys/missing.key"\n'
      );
      const run = await cli(["check", "--dir", dir]);
      expect(run.code).to.equal(1);
      expect(run.err).to.contain(
        "encryption.key: unsupported reference secret://vault/x"
      );
      expect(run.err).to.contain(
        "extra: secret://env/NOT_IN_ENV: environment variable NOT_IN_ENV is not set"
      );
      expect(run.err).to.contain(
        "other: secret://file/opt/fonoster/keys/missing.key: cannot read"
      );
      expect(run.err).to.not.contain("nats.password");
      for (const value of env.values())
        if (value.length > 12) expect(run.err + run.out).to.not.contain(value);
    });

    it("resolves placeholders from .env and names an unset one with its file and key", async function () {
      const dir = unpack();
      await init(dir);
      await exportConfigSchemas(join(dir, "config", "schemas"));
      const envFile = join(dir, ".env");
      writeFileSync(
        envFile,
        readFileSync(envFile, "utf8").replace(
          /^ENCRYPTION_KEY=.*$/m,
          "ENCRYPTION_KEY="
        )
      );
      const run = await cli(["check", "--dir", dir]);
      expect(run.code).to.equal(1);
      for (const f of ["fonoster", "appbridge", "autopilot"])
        expect(run.err).to.contain(
          `config/${f}.yaml: encryption.key: \${ENCRYPTION_KEY} not set in .env`
        );
    });

    it("exits non-zero before init", async function () {
      const run = await cli(["check", "--dir", unpack()]);
      expect(run.code).to.equal(1);
      expect(run.err).to.contain("init");
    });
  });

  describe("render", function () {
    it("fails naming the file, line and variable when a value is missing", function () {
      try {
        renderTemplate(
          "a: 1\nb: ${MISSING}\nc: ${SET:-x}\n",
          {},
          "config/t.example.yaml"
        );
        expect.fail("no error");
      } catch (e) {
        expect(e).to.be.instanceOf(RenderError);
        expect((e as RenderError).problems).to.deep.equal([
          "config/t.example.yaml:2: ${MISSING} is not set"
        ]);
      }
    });

    it("keeps placeholders, or substitutes them for another container's file", function () {
      const t = "# ${NOT_CHECKED}\na: ${SET}\nb: ${UNSET:-x}\n";
      expect(renderTemplate(t, { SET: "v" })).to.equal(t);
      expect(renderTemplate(t, { SET: "v" }, "t", true)).to.equal(
        "# ${NOT_CHECKED}\na: v\nb: x\n"
      );
    });

    it("deep-merges an overlay (null removes a key)", async function () {
      expect(
        deepMerge(
          { a: { b: 1, c: 2 }, d: [1], e: 1 },
          { a: { c: 3 }, d: [2], e: null }
        )
      ).to.deep.equal({ a: { b: 1, c: 3 }, d: [2] });
      const dir = unpack();
      await init(dir);
      const overlay = mkdtempSync(join(tmpdir(), "overlay-"));
      writeFileSync(
        join(overlay, "appbridge.yaml"),
        'providers:\n  deepgram: { tts: { url: "http://dg-proxy:${PROXY_PORT}" } }\n'
      );
      const run = await cli([
        "render",
        "--config-dir",
        join(dir, "config"),
        "--env-file",
        join(dir, ".env"),
        "--overlay",
        overlay
      ]);
      expect(run.code, run.err).to.equal(1);
      expect(run.err).to.contain("${PROXY_PORT} is not set");
      appendFileSync(join(dir, ".env"), "PROXY_PORT=8080\n");
      expect(
        (await cli(["render", "--dir", dir, "--overlay", overlay])).code
      ).to.equal(0);
      const gw = yamlOf(dir, "appbridge.yaml");
      expect(gw.providers.deepgram).to.deep.equal({
        adapter: "deepgram",
        capabilities: ["tts", "stt"],
        credential: { value: "YOUR_DEEPGRAM_API_KEY" },
        tts: { url: "http://dg-proxy:${PROXY_PORT}" }
      });
      expect(gw.providers.elevenlabs.adapter).to.equal("elevenlabs");
    });

    it("renders into another folder, and refuses the unfilled example values", async function () {
      const dir = unpack();
      const example = Object.fromEntries(
        readEnvFile(join(dir, ".env.example"))
      );
      expect(() =>
        renderConfigDir({ configDir: join(dir, "config"), env: example })
      ).to.throw(RenderError, "${HOST_IP} is not set");
      await init(dir);
      const out = mkdtempSync(join(tmpdir(), "rendered-"));
      const env = Object.fromEntries(readEnvFile(join(dir, ".env")));
      env.SIP_PORT = "16060";
      expect(
        renderConfigDir({ configDir: join(dir, "config"), outDir: out, env })
      ).to.include("appbridge.yaml");
      expect(
        parse(readFileSync(join(out, "fonoster.yaml"), "utf8")).appUrl
      ).to.equal("${PUBLIC_URL}");
      expect(
        parse(readFileSync(join(out, "routr-edgeport.yaml"), "utf8")).spec
          .transport[0].port
      ).to.equal(16060);
    });
  });

  describe("helpers and usage", function () {
    it("suggests the closest known key for a typo only", function () {
      expect(suggestKey("turnTakng", ["turnTaking", "telemetry"])).to.equal(
        "turnTaking"
      );
      expect(suggestKey("databse", ["database", "nats"])).to.equal("database");
      expect(suggestKey("zzz", ["database", "nats"])).to.equal(undefined);
    });

    it("generates secrets only for secret names", function () {
      expect(generateSecret("SIP_PORT")).to.equal(undefined);
      expect(generateSecret("FOO_PASSWORD")).to.match(/^s[0-9a-f]{32}$/);
      for (let i = 0; i < 50; i++)
        expect(encryptionKey()).to.match(/^k1\.aesgcm256\.[A-Za-z0-9_-]{43}=$/);
    });

    it("prints help and rejects unknown commands and options", async function () {
      const help = await cli(["--help"]);
      expect(help.code).to.equal(0);
      for (const c of [
        "init",
        "info",
        "check",
        "--host-ip",
        "docker compose up -d"
      ])
        expect(help.out).to.contain(c);
      expect((await cli(["nope"])).code).to.equal(2);
      expect((await cli(["init", "--regions"])).err).to.contain(
        "unknown option --regions"
      );
      expect((await cli(["init", "--nope"])).err).to.contain(
        "unknown option --nope"
      );
      expect((await cli([])).code).to.equal(2);
    });
  });
});
