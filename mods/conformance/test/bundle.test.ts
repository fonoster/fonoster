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
// The self-host Compose bundle (add-self-host-installer, unify-config-placeholders):
// ops/bundle/compose.yaml uses published images only and has no profiles, nothing in it says
// "rebuild", its copies of the dev stack's static configs stay in sync, and its examples, written
// the way `fonoster-config init` writes them (placeholders kept), load through each service's own
// config validation with .env's values, which Compose passes to the containers.
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { parse } from "yaml";
import {
  decryptStringSync,
  encryptStringSync,
  findKeyForMessage,
  makeKeychainSync,
  parseKeySync
} from "@47ng/cloak";
import { loadServiceConfig } from "@fonoster/common";
import { getSignalingServer } from "../../apiserver/src/config";
import {
  FonosterConfig,
  fonosterConfigSchema,
  SHARED_VALUE_PATHS
} from "../../apiserver/src/config/schema";
import { loadHostedConfig } from "../../autopilot/src/session/hosted";
import { expandEnv, readEnvFile } from "../../common/src/config/cli/envFile";
import { tlsEnabled } from "../../common/src/config/cli/exposure";
import { renderConfigDir } from "../../common/src/config/cli/render";
import { ensureKeys } from "../../common/src/config/cli/secrets";
import { loadConfig as loadAppBridgeConfig } from "../../appbridge/src/config";

const ROOT = path.join(__dirname, "..", "..", "..");
const BUNDLE = path.join(ROOT, "ops", "bundle");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

type Service = {
  image?: string;
  build?: unknown;
  profiles?: string[];
  env_file?: unknown;
  volumes?: string[];
  environment?: Record<string, string>;
  depends_on?: Record<string, { condition: string }>;
  healthcheck?: { test: string[] };
};

function filesUnder(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? filesUnder(path.join(dir, e.name))
        : [path.join(dir, e.name)]
    );
}

/** Content without whole-line comments (the bundle's copies have their own comments). */
const body = (text: string) =>
  text
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("#"))
    .join("\n")
    .trim();

describe("@conformance[bundle] self-host Compose bundle", function () {
  const compose = parse(
    fs.readFileSync(path.join(BUNDLE, "compose.yaml"), "utf8")
  );
  const services = compose.services as Record<string, Service>;

  it("uses published images only, Fonoster's pinned to FONOSTER_VERSION and Roomr's by digest", function () {
    for (const [name, svc] of Object.entries(services)) {
      expect(svc.build, name).to.equal(undefined);
      expect(svc.image, name).to.be.a("string");
    }
    // Roomr is released from fonoster/roomr: the version of @fonoster/roomr the suites run, by
    // digest (extract-roomr 2.2).
    const roomr = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
    ).dependencies["@fonoster/roomr"];
    expect(services.roomr.image).to.match(
      new RegExp(
        `^fonoster/roomr:${roomr.replace(/\./g, "\\.")}@sha256:[0-9a-f]{64}$`
      )
    );
    for (const svc of ["appbridge", "autopilot", "apiserver", "dashboard"])
      expect(services[svc].image).to.match(
        new RegExp(`^fonoster/${svc}:\\$\\{FONOSTER_VERSION`)
      );
    expect(Object.keys(services)).to.not.include.members(["fakes"]);
    expect(Object.keys(services)).to.not.include("sipcaller");
  });

  it("starts the core path, the dashboard and Autopilot, with no opt-in profiles", function () {
    for (const [name, svc] of Object.entries(services))
      expect(svc.profiles, name).to.equal(undefined);
    expect(Object.keys(services).sort()).to.deep.equal(
      [
        "apiserver",
        "autopilot",
        "dashboard",
        "envoy",
        "appbridge",
        "roomr",
        "minio",
        "nats",
        "postgres",
        "routr",
        "rtpengine"
      ].sort()
    );
  });

  const FILES: Record<string, string> = {
    apiserver: "fonoster",
    appbridge: "appbridge",
    autopilot: "autopilot",
    roomr: "roomr"
  };

  const OTLP_PASSTHROUGH = [
    "OTEL_EXPORTER_OTLP_HEADERS",
    "OTEL_EXPORTER_OTLP_PROTOCOL"
  ];

  it("passes the OTLP headers and protocol through to every service that gets the endpoint", function () {
    const env = readEnvFile(path.join(BUNDLE, ".env.example"));
    for (const k of OTLP_PASSTHROUGH) expect(env.has(k), k).to.equal(true);
    for (const [svc, s] of Object.entries(services)) {
      if (!s.environment?.OTEL_EXPORTER_OTLP_ENDPOINT) continue;
      for (const k of OTLP_PASSTHROUGH)
        expect(s.environment[k], `${svc}: ${k}`).to.equal(`\${${k}:-}`);
    }
  });

  /** The ${NAME}s a config example names (comments included: optional settings), but `NAME`. */
  const placeholders = (file: string) =>
    new Set(
      [
        ...fs
          .readFileSync(path.join(BUNDLE, "config", file), "utf8")
          .matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)/g)
      ]
        .map((m) => m[1])
        .filter((n) => n !== "NAME")
    );

  it("gives each Fonoster service its file at /config and only the values that file names", function () {
    for (const [svc, file] of Object.entries(FILES)) {
      const s = services[svc];
      // Never the whole .env: a compromised service must not read the others' secrets.
      expect(s.env_file, svc).to.equal(undefined);
      expect(s.volumes, svc).to.include(
        `\${CONFIG_DIR:-./config}/${file}.yaml:/config/${file}.yaml:ro`
      );
      expect(
        Object.keys(s.environment ?? {}).sort(),
        `${svc}: environment`
      ).to.deep.equal(
        [
          ...placeholders(`${file}.example.yaml`),
          // Read by the OpenTelemetry SDK from the environment, not by the config file.
          ...OTLP_PASSTHROUGH
        ].sort()
      );
      for (const [k, v] of Object.entries(s.environment ?? {}))
        expect(v, `${svc}: ${k}`).to.match(
          new RegExp(`^\\$\\{${k}(:[-?].*)?\\}$`)
        );
    }
  });

  it("mounts Identity's private signing key into the API server only", function () {
    // The host side of a volume: the text before the container path.
    const source = (v: string) => v.replace(/:\/[^:]*(:ro)?$/, "");
    expect(services.apiserver.volumes?.map(source)).to.include(
      "${CONFIG_DIR:-./config}/keys"
    );
    for (const [svc, s] of Object.entries(services)) {
      if (svc === "apiserver") continue;
      for (const src of (s.volumes ?? []).map(source)) {
        // Neither the whole keys folder nor the private key itself.
        expect(src, `${svc}: ${src}`).to.not.match(/\/keys\/?$/);
        expect(src, `${svc}: ${src}`).to.not.contain("private.pem");
      }
    }
    expect(services.appbridge.volumes).to.include.members([
      "${CONFIG_DIR:-./config}/keys/public.pem:/etc/fonoster/keys/public.pem:ro",
      "${CONFIG_DIR:-./config}/keys/records.pem:/etc/fonoster/keys/records.pem:ro"
    ]);
  });

  it("keeps AppBridge's call records in flight in a named volume at callRecord.dir", function () {
    const { dir, env } = install();
    const recordsDir = loadAppBridgeConfig(
      path.join(dir, "appbridge.yaml"),
      env
    ).callRecord?.dir;
    expect(recordsDir).to.equal("/var/lib/fonoster/records");
    // Not under /tmp, and not lost when the container is recreated.
    expect(services.appbridge.volumes).to.include(
      `appbridge-records:${recordsDir}`
    );
    expect(Object.keys(compose.volumes as object)).to.include(
      "appbridge-records"
    );
  });

  it("never reuses a legacy install's volumes (same project name, fonoster)", function () {
    // The root compose.yaml of Fonoster 0.27 and older named its volumes db and influxdb.
    const legacy = ["db", "influxdb"];
    const names = Object.keys(compose.volumes as Record<string, unknown>);
    expect(names).to.not.be.empty;
    for (const name of names) expect(legacy, name).to.not.include(name);
    for (const [svc, s] of Object.entries(services))
      for (const v of s.volumes ?? []) {
        const source = v.split(":")[0];
        expect(legacy, `${svc}: ${v}`).to.not.include(source);
      }
  });

  it("starts AppBridge and Autopilot after the API server is migrated and serving", function () {
    expect(services.apiserver.healthcheck?.test).to.deep.equal([
      "CMD",
      "node",
      "/work/mods/apiserver/dist/bin/healthcheck.js"
    ]);
    for (const svc of ["appbridge", "autopilot"])
      expect(services[svc].depends_on?.apiserver, svc).to.deep.equal({
        condition: "service_healthy"
      });
  });

  it("lists no fake provider in its catalog (conformance: fakes are not available in production)", function () {
    const { entries } = parse(
      fs.readFileSync(path.join(BUNDLE, "config", "catalog.yaml"), "utf8")
    ) as { entries: { kind: string; id: string; adapter?: string }[] };
    expect(
      entries.filter((e) => e.kind === "provider" && e.adapter === "fake")
    ).to.deep.equal([]);
  });

  it("never says rebuild or RB_", function () {
    for (const file of filesUnder(BUNDLE))
      expect(fs.readFileSync(file, "utf8"), file).to.not.match(/rebuild|RB_/i);
  });

  /** Runs the Envoy entrypoint's CORS rewrite (Compose turns $$ into $) on a shipped file. */
  function corsRewrite(file: string, origins: string) {
    const svc = services.envoy as Service & { command?: string[] };
    const work = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-envoy-"));
    const out = path.join(work, "envoy.yaml");
    const script = svc
      .command![0].replace(/\$\$/g, "$")
      .replace("/etc/envoy/envoy.yaml", path.join(BUNDLE, "config", file))
      .replace("/tmp/envoy.yaml", out)
      .replace(/&& exec envoy.*$/, "");
    execFileSync("/bin/sh", ["-c", script], {
      env: { ...process.env, CORS_ALLOWED_ORIGINS: origins }
    });
    const text = fs.readFileSync(out, "utf8");
    fs.rmSync(work, { recursive: true, force: true });
    return text;
  }

  it("lets only the configured browser origins call the API (CORS, M9)", function () {
    for (const file of ["envoy.yaml", "envoy-tls.yaml"]) {
      const envoy = read(`ops/bundle/config/${file}`);
      expect(envoy, file).to.not.contain('prefix: "*"');
      expect(envoy, file).to.contain('- exact: "__CORS_ALLOWED_ORIGINS__"');
      const two = corsRewrite(
        file,
        "https://app.example.com, https://b.example.com"
      );
      expect(two).to.contain('- exact: "https://app.example.com"');
      expect(two).to.contain('- exact: "https://b.example.com"');
      expect(two).to.not.contain("__CORS_ALLOWED_ORIGINS__");
      expect(corsRewrite(file, "").trimEnd(), file).to.equal(envoy.trimEnd());
    }
    expect(services.envoy.environment?.CORS_ALLOWED_ORIGINS).to.equal(
      "${CORS_ALLOWED_ORIGINS:-}"
    );
  });

  // ---- HTTPS (M10): compose.tls.yaml, opted in from .env; plain HTTP stays the default ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Envoy = Record<string, any>;
  const envoyConfig = (file: string): Envoy =>
    parse(read(`ops/bundle/config/${file}`));
  const listener = (cfg: Envoy, name: string) =>
    cfg.static_resources.listeners.find(
      (l: { name: string }) => l.name === name
    );
  const hcm = (l: Envoy) =>
    l.filter_chains[0].filters.find(
      (f: { name: string }) =>
        f.name === "envoy.filters.network.http_connection_manager"
    ).typed_config;
  const tlsCompose = () =>
    parse(fs.readFileSync(path.join(BUNDLE, "compose.tls.yaml"), "utf8"), {
      customTags: [
        { tag: "!override", collection: "seq", resolve: (v: unknown) => v }
      ]
    }) as { services: Record<string, Service & { ports?: string[] }> };

  it("serves plain HTTP on HTTP_PORT by default, with no TLS and no 443", function () {
    const envoy = services.envoy as Service & { ports?: string[] };
    expect(envoy.ports).to.deep.equal([
      "${HTTP_BIND:-0.0.0.0}:${HTTP_PORT:-8449}:8449"
    ]);
    expect(envoy.volumes).to.deep.equal([
      "${CONFIG_DIR:-./config}/envoy.yaml:/etc/envoy/envoy.yaml:ro"
    ]);
    const cfg = envoyConfig("envoy.yaml");
    expect(
      cfg.static_resources.listeners.map((l: { name: string }) => l.name)
    ).to.deep.equal(["listener_http"]);
    expect(read("ops/bundle/config/envoy.yaml")).to.not.contain(
      "transport_socket"
    );
    // .env.example only documents HTTPS: nothing turns it on.
    const example = readEnvFile(path.join(BUNDLE, ".env.example"));
    for (const name of ["COMPOSE_FILE", "TLS_CERT", "TLS_KEY", "HTTP_BIND"])
      expect(example.has(name), name).to.equal(false);
    expect(tlsEnabled(Object.fromEntries(example))).to.equal(false);
    expect(read("ops/bundle/.env.example")).to.contain(
      "# COMPOSE_FILE=compose.yaml:compose.tls.yaml"
    );
    // SIP over TLS is documented, not on. WSS is there for browsers on an https:// dashboard
    // (Envoy terminates TLS and proxies to ws), and nothing publishes its port.
    const edge = parse(
      read("ops/bundle/config/routr-edgeport.example.yaml")
    ).spec.transport.map((t: { protocol: string }) => t.protocol);
    expect(edge).to.deep.equal(["tcp", "udp", "ws", "wss"]);
    expect(read("ops/bundle/compose.yaml")).not.to.contain("5063");
    expect(read("ops/bundle/config/routr-edgeport.example.yaml")).to.match(
      /# - protocol: tls\n\s*# {3}port: 5061/
    );
  });

  it("serves HTTPS on 443 with the operator's certificate and redirects 80 (compose.tls.yaml)", function () {
    const text = fs.readFileSync(path.join(BUNDLE, "compose.tls.yaml"), "utf8");
    const envoy = tlsCompose().services.envoy;
    expect(Object.keys(tlsCompose().services)).to.deep.equal(["envoy"]);
    // Same container path as compose.yaml's mount, so Compose replaces it; the cert and key are
    // the operator's files, read-only, and required once the file is on.
    expect(envoy.volumes).to.deep.equal([
      "${CONFIG_DIR:-./config}/envoy-tls.yaml:/etc/envoy/envoy.yaml:ro",
      "${TLS_CERT:?set TLS_CERT in .env (the certificate chain, PEM)}:/etc/envoy/tls/fullchain.pem:ro",
      "${TLS_KEY:?set TLS_KEY in .env (the private key, PEM)}:/etc/envoy/tls/privkey.pem:ro"
    ]);
    // !override: the plain HTTP port is not published next to them.
    expect(text).to.match(/ports: !override\n/);
    expect(envoy.ports).to.deep.equal([
      "${HTTPS_BIND:-0.0.0.0}:${HTTPS_PORT:-443}:8443",
      "${HTTPS_BIND:-0.0.0.0}:${HTTPS_REDIRECT_PORT:-80}:8080"
    ]);

    const tls = envoyConfig("envoy-tls.yaml");
    expect(
      tls.static_resources.listeners.map((l: { name: string }) => l.name)
    ).to.deep.equal(["listener_http_redirect", "listener_https"]);
    const https = listener(tls, "listener_https");
    expect(https.address.socket_address.port_value).to.equal(8443);
    const socket = https.filter_chains[0].transport_socket;
    expect(socket.name).to.equal("envoy.transport_sockets.tls");
    const ctx = socket.typed_config.common_tls_context;
    expect(ctx.tls_certificates).to.deep.equal([
      {
        certificate_chain: { filename: "/etc/envoy/tls/fullchain.pem" },
        private_key: { filename: "/etc/envoy/tls/privkey.pem" }
      }
    ]);
    expect(ctx.alpn_protocols).to.include("h2");
    expect(ctx.tls_params.tls_minimum_protocol_version).to.equal("TLSv1_2");

    // Port 80 answers only with a redirect to HTTPS: no route reaches a service.
    const redirect = listener(tls, "listener_http_redirect");
    expect(redirect.address.socket_address.port_value).to.equal(8080);
    expect(redirect.filter_chains[0].transport_socket).to.equal(undefined);
    const routes = hcm(redirect).route_config.virtual_hosts.flatMap(
      (v: { routes: unknown[] }) => v.routes
    );
    expect(routes).to.deep.equal([
      { match: { prefix: "/" }, redirect: { https_redirect: true } }
    ]);

    // Everything else is envoy.yaml's: routes, filters, CORS and clusters (HSTS added).
    const plain = hcm(listener(envoyConfig("envoy.yaml"), "listener_http"));
    const secure = hcm(https);
    const vhost = secure.route_config.virtual_hosts[0];
    expect(vhost.response_headers_to_add).to.deep.equal([
      {
        append_action: "OVERWRITE_IF_EXISTS_OR_ADD",
        header: { key: "strict-transport-security", value: "max-age=31536000" }
      }
    ]);
    delete vhost.response_headers_to_add;
    expect({ ...secure, stat_prefix: undefined }).to.deep.equal({
      ...plain,
      stat_prefix: undefined
    });
    expect(tls.static_resources.clusters).to.deep.equal(
      envoyConfig("envoy.yaml").static_resources.clusters
    );
  });

  it("points browser calls at wss:// on the HTTPS origin, ws:// by default", function () {
    const { dir, env } = install();
    const signaling = (publicUrl?: string) =>
      getSignalingServer(
        loadApiserver(
          dir,
          publicUrl ? { ...env, PUBLIC_URL: publicUrl } : env
        ) as unknown as FonosterConfig
      );
    expect(signaling()).to.equal("ws://192.0.2.10:8449/sip");
    expect(signaling("https://voice.example.com")).to.equal(
      "wss://voice.example.com/sip"
    );
  });

  it("keeps its copies of the static configs in sync", function () {
    expect(read("ops/bundle/config/envoy.yaml")).to.equal(
      read("config/envoy.yaml")
    );
    for (const f of ["postgres-init.sql"])
      expect(read(`ops/bundle/config/${f}`), f).to.equal(
        read(`ops/rebuild/config/${f}`)
      );
    for (const u of ["apiserver", "appbridge", "roomr", "routr"])
      expect(
        body(read(`ops/bundle/config/nats-permissions/${u}.conf`)),
        u
      ).to.equal(body(read(`ops/rebuild/config/nats-permissions/${u}.conf`)));
    expect(body(read("ops/bundle/config/catalog.yaml"))).to.equal(
      body(read("ops/rebuild/config/catalog-seed.yaml"))
    );
    // The main NATS's users and settings (the dev file also has a commented leaf block).
    expect(body(read("ops/bundle/config/nats.conf"))).to.equal(
      body(read("ops/rebuild/config/nats.conf"))
    );
  });

  it("names in its examples only values .env.example defines (or that have a default)", function () {
    const defined = readEnvFile(path.join(BUNDLE, ".env.example"));
    const dir = path.join(BUNDLE, "config");
    for (const f of fs
      .readdirSync(dir)
      .filter((n) => n.includes(".example."))) {
      const refs = body(fs.readFileSync(path.join(dir, f), "utf8")).match(
        /\$\{[A-Za-z_][A-Za-z0-9_]*(?!:-)\}/g
      );
      for (const r of refs ?? [])
        expect(defined.has(r.slice(2, -1)), `${f}: ${r}`).to.equal(true);
    }
  });

  /** The bundle's config folder written as init writes it, and the env Compose passes. */
  function install() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-config-"));
    fs.cpSync(path.join(BUNDLE, "config"), dir, { recursive: true });
    ensureKeys(dir);
    const example = readEnvFile(path.join(BUNDLE, ".env.example"));
    for (const [k, v] of example)
      if (v === "") example.set(k, `x${k.length}secret${k}`);
    example.set("HOST_IP", "192.0.2.10");
    example.set("OTEL_EXPORTER_OTLP_ENDPOINT", "");
    example.set("OTEL_EXPORTER_OTLP_HEADERS", "");
    example.set("OTEL_EXPORTER_OTLP_PROTOCOL", "");
    example.set(
      "ENCRYPTION_KEY",
      "k1.aesgcm256.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
    );
    const env = expandEnv(example);
    renderConfigDir({ configDir: dir, env });
    return { dir, env };
  }

  function loadApiserver(dir: string, env: Record<string, string>) {
    // Key files are read in the container; point them at the written ones.
    const fonoster = parse(
      fs.readFileSync(path.join(dir, "fonoster.yaml"), "utf8")
    );
    const api = path.join(dir, "fonoster.check.json");
    fs.writeFileSync(
      api,
      JSON.stringify(fonoster).replace(/\/opt\/fonoster\//g, `${dir}/`)
    );
    return loadServiceConfig({
      service: "apiserver",
      schema: fonosterConfigSchema,
      argv: ["node", "x", "--config", api],
      env,
      interpolatePaths: SHARED_VALUE_PATHS
    }) as {
      encryption: { key: string };
      regions?: { hub?: unknown; public: { endpoints?: { sip: unknown[] } }[] };
      telemetry?: { otlpEndpoint?: string };
    };
  }

  it("writes configs each service loads with only its own values from .env, and no secret in them", function () {
    const { dir, env } = install();
    // What Compose passes each container: its `environment:` names, not the whole .env.
    const only = (svc: string) =>
      Object.fromEntries(
        Object.keys(services[svc].environment ?? {}).map((k) => [k, env[k]])
      );
    const loaded = loadApiserver(dir, only("apiserver"));
    expect(loaded.regions?.hub).to.equal(undefined);
    expect(loaded.regions?.public[0].endpoints?.sip[0]).to.deep.equal({
      host: "192.0.2.10",
      port: 5060,
      transport: "udp"
    });
    expect(loaded.telemetry?.otlpEndpoint).to.equal("");

    const gw = loadAppBridgeConfig(
      path.join(dir, "appbridge.yaml"),
      only("appbridge")
    );
    expect(gw.callRecord?.analytics).to.equal(undefined);
    expect(gw.nats.password).to.equal(env.NATS_APPBRIDGE_PASSWORD);

    const ap = loadHostedConfig(
      path.join(dir, "autopilot.yaml"),
      only("autopilot")
    );
    expect(ap.database?.url).to.contain("@postgres:5432/fonoster");
    // Autopilot checks signatures against the URL Autopilot apps get (apps.autopilotUrl).
    expect(ap.publicUrl).to.equal(
      (loaded as unknown as { apps: { autopilotUrl: string } }).apps
        .autopilotUrl
    );

    for (const f of [
      "fonoster.yaml",
      "appbridge.yaml",
      "autopilot.yaml",
      "roomr.yaml"
    ]) {
      const text = fs.readFileSync(path.join(dir, f), "utf8");
      for (const [k, v] of Object.entries(env))
        if (v.includes("secret"))
          expect(text, `${f} holds ${k}`).to.not.contain(v);
    }
  });

  it("lets AppBridge and Autopilot decrypt a vendor key the API server encrypted", function () {
    const { dir, env } = install();
    const apiKey = loadApiserver(dir, env).encryption.key;
    // What prisma-field-encryption stores for a workspace vendor key.
    const stored = encryptStringSync("dg-workspace-key", parseKeySync(apiKey));
    const gwKey = loadAppBridgeConfig(path.join(dir, "appbridge.yaml"), env)
      .encryption?.key;
    const apKey = loadHostedConfig(path.join(dir, "autopilot.yaml"), env)
      .encryption?.key;
    for (const key of [gwKey, apKey]) {
      expect(key).to.be.a("string");
      const keychain = makeKeychainSync([key!]);
      const match = findKeyForMessage(stored, keychain);
      expect(decryptStringSync(stored, match)).to.equal("dg-workspace-key");
    }
    // A service without the key fails the same way it would at start.
    expect(() =>
      loadAppBridgeConfig(path.join(dir, "appbridge.yaml"), {
        ...env,
        ENCRYPTION_KEY: ""
      })
    ).to.throw(/encryption\.key: .*ENCRYPTION_KEY/);
  });
});
