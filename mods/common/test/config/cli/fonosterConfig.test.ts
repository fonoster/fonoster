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
import { createPrivateKey, createPublicKey } from "crypto";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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
  for (const name of ["fonoster", "gateway", "autopilot", "routr-edgeport"]) {
    const schema = shapeSchema(yamlOf(dir, `${name}.yaml`)) as {
      properties: Record<string, object>;
      required: string[];
    };
    if (name === "gateway") schema.properties.turnTaking = { type: "object" };
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
        "config/gateway.yaml",
        "config/autopilot.yaml",
        "config/medianode.yaml",
        "config/routr-edgeport.yaml",
        "config/keys/private.pem",
        "config/keys/public.pem",
        "config/keys/records.pem"
      ])
        expect(existsSync(join(dir, f)), f).to.equal(true);
      // The region hub is opt-in (init --regions).
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
        "NATS_GATEWAY_PASSWORD",
        "NATS_MEDIANODE_PASSWORD",
        "NATS_ROUTR_PASSWORD",
        "AUTOPILOT_SIGNING_SECRET",
        "MEDIANODE_PASSWORD",
        "OWNER_PASSWORD",
        "ENCRYPTION_KEY"
      ])
        expect(env.get(name), name).to.have.length.greaterThan(15);
      for (const svc of ["APISERVER", "GATEWAY", "MEDIANODE", "ROUTR"])
        expect(env.get(`NATS_${svc}_PASSWORD`)).to.match(/^[a-z][0-9a-f]+$/);
      expect(env.get("ENCRYPTION_KEY")).to.match(
        /^k1\.aesgcm256\.[A-Za-z0-9=]+$/
      );
      expect(
        Buffer.from(env.get("ENCRYPTION_KEY")!.slice(13), "base64")
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
        "config/gateway.yaml",
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
      expect(yamlOf(dir, "gateway.yaml").encryption.key).to.equal(
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
      expect(yamlOf(dir, "gateway.yaml").callRecord.analytics).to.equal(
        undefined
      );
      // Routr can't resolve placeholders: its file gets the values (no secrets in it).
      expect(
        yamlOf(dir, "routr-edgeport.yaml").spec.transport[0].port
      ).to.equal(5060);
      const secrets = Object.entries(env).filter(
        ([k, v]) => /(_PASSWORD|_SECRET|_KEY)$/.test(k) && v.length > 8
      );
      expect(secrets.length).to.be.greaterThan(8);
      for (const f of [
        "fonoster.yaml",
        "gateway.yaml",
        "autopilot.yaml",
        "medianode.yaml",
        "routr-edgeport.yaml"
      ]) {
        const text = readFileSync(join(dir, "config", f), "utf8");
        for (const [name, value] of secrets)
          expect(text, `${f} holds ${name}`).to.not.contain(value);
      }
    });

    it("generates the region hub with --regions and prints what to add", async function () {
      const dir = unpack();
      const run = await cli([
        "init",
        "--dir",
        dir,
        "--host-ip",
        "192.0.2.10",
        "--regions"
      ]);
      expect(run.code, run.err).to.equal(0);
      for (const f of [
        "config/region-hub.conf",
        "config/keys/region-operator.key",
        "config/keys/region-signing.pem",
        "config/keys/region-hub/operator.seed",
        "config/keys/region-hub/account.seed",
        "config/keys/region-hub/control-plane.creds",
        "config/keys/region-hub/system.creds"
      ]) {
        expect(existsSync(join(dir, f)), f).to.equal(true);
        expect(mode(join(dir, f)), f).to.equal(0o644);
      }
      const conf = readFileSync(join(dir, "config/region-hub.conf"), "utf8");
      expect(conf).to.match(/^operator: /m);
      // TLS on the leaf listener.
      expect(conf).to.contain('cert_file: "/etc/nats/tls/leaf.crt"');
      expect(run.out).to.contain("nats-regions:");
      expect(run.out).to.contain("compose.override.yaml");
      expect(run.out).to.contain('leafUrl: "tls://${HOST_IP}:7422"');
      expect(run.out).to.contain(
        "credentialsFile: /opt/fonoster/keys/region-hub/control-plane.creds"
      );
      // A second run keeps the hub byte for byte.
      const before = readFileSync(
        join(dir, "config/keys/region-hub/account.seed")
      );
      expect((await cli(["init", "--dir", dir, "--regions"])).code).to.equal(0);
      expect(
        readFileSync(join(dir, "config/keys/region-hub/account.seed")).equals(
          before
        )
      ).to.equal(true);
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
      for (const f of ["fonoster", "gateway", "autopilot", "routr-edgeport"])
        expect(run.out).to.contain(`config/${f}.yaml: valid`);
    });

    it("validates against the schemas the bundle ships (exportConfigSchemas)", async function () {
      const dir = unpack();
      await init(dir);
      await exportConfigSchemas(join(dir, "config", "schemas"));
      const ok = await cli(["check", "--dir", dir]);
      expect(ok.code, ok.err).to.equal(0);
      expect(ok.out).to.contain("config/gateway.yaml: valid");
      appendFileSync(
        join(dir, "config/gateway.yaml"),
        "turnTakng: { mode: auto }\n"
      );
      const bad = await cli(["check", "--dir", dir]);
      expect(bad.code).to.equal(1);
      expect(bad.err).to.contain("config/gateway.yaml: turnTakng");
    });

    it("names the file and an unknown key, suggests the right one and fails", async function () {
      const dir = unpack();
      await init(dir);
      writeSchemas(dir);
      appendFileSync(
        join(dir, "config/gateway.yaml"),
        "turnTakng: { mode: auto }\n"
      );
      const run = await cli(["check", "--dir", dir]);
      expect(run.code).to.equal(1);
      expect(run.err).to.contain(
        "config/gateway.yaml: turnTakng: unknown key (did you mean turnTaking?)"
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
      const file = join(dir, "config/gateway.yaml");
      writeFileSync(
        file,
        readFileSync(file, "utf8")
          .replace(
            'password: "${NATS_GATEWAY_PASSWORD}"',
            'password: "secret://env/NATS_GATEWAY_PASSWORD"'
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
      for (const f of ["fonoster", "gateway", "autopilot"])
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
        join(overlay, "gateway.yaml"),
        'testMode: true\nproviders:\n  deepgram: { adapter: fake, tts: { url: "http://fakes:${FAKE_PORT}" } }\n'
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
      expect(run.err).to.contain("${FAKE_PORT} is not set");
      appendFileSync(join(dir, ".env"), "FAKE_PORT=7001\n");
      expect(
        (await cli(["render", "--dir", dir, "--overlay", overlay])).code
      ).to.equal(0);
      const gw = yamlOf(dir, "gateway.yaml");
      expect(gw.testMode).to.equal(true);
      expect(gw.providers.deepgram).to.deep.equal({
        adapter: "fake",
        capabilities: ["tts", "stt"],
        tts: { url: "http://fakes:${FAKE_PORT}" }
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
      ).to.include("gateway.yaml");
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
      expect(suggestKey("turnTakng", ["turnTaking", "testMode"])).to.equal(
        "turnTaking"
      );
      expect(suggestKey("databse", ["database", "nats"])).to.equal("database");
      expect(suggestKey("zzz", ["database", "nats"])).to.equal(undefined);
    });

    it("generates secrets only for secret names", function () {
      expect(generateSecret("SIP_PORT")).to.equal(undefined);
      expect(generateSecret("FOO_PASSWORD")).to.match(/^s[0-9a-f]{32}$/);
      for (let i = 0; i < 50; i++) expect(encryptionKey()).to.not.match(/[+/]/);
    });

    it("prints help and rejects unknown commands and options", async function () {
      const help = await cli(["--help"]);
      expect(help.code).to.equal(0);
      for (const c of [
        "init",
        "info",
        "check",
        "--host-ip",
        "--regions",
        "docker compose up -d"
      ])
        expect(help.out).to.contain(c);
      expect((await cli(["nope"])).code).to.equal(2);
      expect((await cli(["init", "--nope"])).err).to.contain(
        "unknown option --nope"
      );
      expect((await cli([])).code).to.equal(2);
    });
  });
});
