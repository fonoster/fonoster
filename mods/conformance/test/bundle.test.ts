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
// The self-host Compose bundle (add-self-host-installer): ops/bundle/compose.yaml uses published
// images only, its profiles are the documented ones, nothing in it says "rebuild", its copies of
// the dev stack's static configs stay in sync, and its examples, rendered the way
// `fonoster-config init` renders them, load through each service's own config validation.
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { loadServiceConfig } from "@fonoster/common";
import { fonosterConfigSchema } from "../../apiserver/src/config/schema";
import { loadHostedConfig } from "../../autopilot/src/session/hosted";
import { expandEnv, readEnvFile } from "../../common/src/config/cli/envFile";
import { renderConfigDir } from "../../common/src/config/cli/render";
import { ensureKeys } from "../../common/src/config/cli/secrets";
import { loadConfig as loadGatewayConfig } from "../../gateway/src/config";

const ROOT = path.join(__dirname, "..", "..", "..");
const BUNDLE = path.join(ROOT, "ops", "bundle");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

type Service = {
  image?: string;
  build?: unknown;
  profiles?: string[];
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

  it("uses published images only, Fonoster's pinned to FONOSTER_VERSION", function () {
    for (const [name, svc] of Object.entries(services)) {
      expect(svc.build, name).to.equal(undefined);
      expect(svc.image, name).to.be.a("string");
    }
    for (const svc of [
      "medianode",
      "gateway",
      "autopilot",
      "apiserver",
      "dashboard"
    ])
      expect(services[svc].image).to.match(
        new RegExp(`^fonoster/${svc}:\\$\\{FONOSTER_VERSION`)
      );
    expect(Object.keys(services)).to.not.include.members(["fakes"]);
    expect(Object.keys(services)).to.not.include("sipcaller");
  });

  it("starts the core path, the dashboard and Autopilot by default; the rest is opt-in", function () {
    const byProfile = (p?: string) =>
      Object.entries(services)
        .filter(([, s]) => (p ? s.profiles?.includes(p) : !s.profiles))
        .map(([n]) => n)
        .sort();
    expect(byProfile()).to.deep.equal(
      [
        "apiserver",
        "autopilot",
        "dashboard",
        "envoy",
        "gateway",
        "medianode",
        "minio",
        "nats",
        "postgres",
        "routr",
        "rtpengine"
      ].sort()
    );
    expect(byProfile("observability")).to.deep.equal(
      ["grafana", "loki", "otel-collector", "prometheus", "tempo"].sort()
    );
    expect(byProfile("analytics")).to.deep.equal(["clickhouse"]);
    expect(byProfile("regions")).to.deep.equal(["nats-regions"]);
  });

  it("never says rebuild or RB_", function () {
    for (const file of filesUnder(BUNDLE))
      expect(fs.readFileSync(file, "utf8"), file).to.not.match(/rebuild|RB_/i);
  });

  it("keeps its copies of the static configs in sync", function () {
    expect(read("ops/bundle/config/envoy.yaml")).to.equal(
      read("config/envoy.yaml")
    );
    for (const f of [
      "otel-collector.yaml",
      "prometheus.yml",
      "loki.yaml",
      "tempo.yaml",
      "postgres-init.sql",
      "grafana/datasources.yaml"
    ])
      expect(read(`ops/bundle/config/${f}`), f).to.equal(
        read(`ops/rebuild/config/${f}`)
      );
    for (const u of ["apiserver", "gateway", "medianode", "routr"])
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

  it("names in its examples only values .env.example defines", function () {
    const defined = readEnvFile(path.join(BUNDLE, ".env.example"));
    const dir = path.join(BUNDLE, "config");
    for (const f of fs
      .readdirSync(dir)
      .filter((n) => n.includes(".example."))) {
      const refs = body(fs.readFileSync(path.join(dir, f), "utf8")).match(
        /\$\{[A-Za-z_][A-Za-z0-9_]*/g
      );
      for (const r of refs ?? [])
        expect(defined.has(r.slice(2)), `${f}: ${r}`).to.equal(true);
    }
  });

  for (const profiles of ["", "regions,analytics"]) {
    it(`renders configs each service loads (profiles: ${profiles || "default"})`, function () {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-config-"));
      fs.cpSync(path.join(BUNDLE, "config"), dir, { recursive: true });
      ensureKeys(dir);
      const example = readEnvFile(path.join(BUNDLE, ".env.example"));
      for (const [k, v] of example)
        if (v === "") example.set(k, `x${k.length}secret`);
      example.set("HOST_IP", "192.0.2.10");
      example.set("COMPOSE_PROFILES", profiles);
      example.set(
        "ENCRYPTION_KEY",
        "k1.aesgcm256.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
      );
      renderConfigDir({ configDir: dir, env: expandEnv(example) });

      // The API server: until it knows `catalog` (add-self-host-installer 1.2), leave it out.
      const fonoster = parse(
        fs.readFileSync(path.join(dir, "fonoster.yaml"), "utf8")
      );
      const inner = fonosterConfigSchema as unknown as {
        _def: { schema?: { shape?: object } };
      };
      const shape = inner._def.schema?.shape;
      if (shape && !("catalog" in shape)) delete fonoster.catalog;
      // Key files are read in the container; point them at the rendered ones.
      const yamlText = JSON.stringify(fonoster).replace(
        /\/opt\/fonoster\//g,
        `${dir}/`
      );
      const api = path.join(dir, "fonoster.check.json");
      fs.writeFileSync(api, yamlText);
      const loaded = loadServiceConfig({
        service: "apiserver",
        schema: fonosterConfigSchema,
        argv: ["node", "x", "--config", api],
        env: {}
      }) as { regions?: { hub?: unknown } };
      expect(Boolean(loaded.regions?.hub)).to.equal(
        profiles.includes("regions")
      );

      const gw = loadGatewayConfig(path.join(dir, "gateway.yaml")) as {
        callRecord?: { analytics?: unknown };
        testMode?: boolean;
      };
      expect(Boolean(gw.callRecord?.analytics)).to.equal(
        profiles.includes("analytics")
      );
      expect(gw.testMode).to.not.equal(true);

      const ap = loadHostedConfig(path.join(dir, "autopilot.yaml"));
      expect(ap.database?.url).to.contain("@postgres:5432/fonoster");
    });
  }
});
