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
// Deployment suite (add-platform 1.4, partial): the Helm chart lints and renders for the data-plane,
// cloud and observability values; every rendered Fonoster config loads through the service's own
// loader with its secret:// references resolved from mounted Secrets; no raw secret is rendered.
// Needs `helm` on PATH (skipped otherwise).
import { execFileSync } from "child_process";
import { randomBytes } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { parseAllDocuments } from "yaml";
import { loadServiceConfig } from "@fonoster/common";
import { fonosterConfigSchema } from "../../apiserver/src/config/schema";
import { loadHostedConfig } from "../../autopilot/src/session/hosted";
import { loadAgentConfig } from "../../region-agent/src/config";
import {
  loadConfig as loadGatewayConfig,
  providerKey
} from "../../gateway/src/config";

const ROOT = path.join(__dirname, "..", "..", "..");
const CHART = path.join(ROOT, "ops", "rebuild", "helm", "fonoster-rebuild");

type K8sObject = {
  kind: string;
  metadata: { name: string };
  data?: Record<string, string>;
  spec?: Record<string, unknown>;
};

function hasHelm() {
  try {
    execFileSync("helm", ["version", "--short"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** The media nodes' rendered medianode.yaml. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function medianodeConfig(objs: K8sObject[]): Record<string, any> {
  return parseAllDocuments(
    find(objs, "ConfigMap", "fonoster-medianode")!.data!["medianode.yaml"]
  )[0].toJS();
}

function render(...valuesFiles: string[]): K8sObject[] {
  const sets = valuesFiles.filter((f) => f.startsWith("--set="));
  valuesFiles = valuesFiles.filter((f) => !f.startsWith("--set="));
  const args = ["template", "fonoster", CHART, ...sets];
  valuesFiles.forEach((f) => args.push("-f", path.join(CHART, f)));
  const out = execFileSync("helm", args, { encoding: "utf8" });
  return parseAllDocuments(out)
    .map((d) => d.toJS() as K8sObject)
    .filter(Boolean);
}

const find = (objs: K8sObject[], kind: string, name: string) =>
  objs.find((o) => o.kind === kind && o.metadata.name === name);

/** A Secrets dir with every Secret values-cloud.yaml names (as kubelet mounts them). */
function fakeSecretsDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helm-secrets-"));
  const secrets: Record<string, Record<string, string>> = {
    "fonoster-db": {
      url: "postgresql://u:p@db:5432/fonoster",
      identityUrl: "postgresql://u:p@db:5432/fnidentity",
      key: `k1.aesgcm256.${randomBytes(32).toString("base64url")}=`
    },
    "fonoster-apiserver": { ownerPassword: "owner-pass" },
    "fonoster-autopilot": { secret: "ap-secret" },
    "medianode-peer": { password: "peer-pass" },
    "fonoster-minio": { rootUser: "minio", rootPassword: "minio-pass" },
    "fonoster-vendors": { deepgram: "dg-key" }
  };
  Object.entries(secrets).forEach(([name, keys]) => {
    fs.mkdirSync(path.join(dir, name));
    Object.entries(keys).forEach(([k, v]) =>
      fs.writeFileSync(path.join(dir, name, k), v)
    );
  });
  return dir;
}

describe("@conformance/deployment (Helm chart)", function () {
  this.timeout(60000);

  before(function () {
    if (!hasHelm()) this.skip();
  });

  it("lints with the default, cloud, observability and private-cell values", function () {
    execFileSync("helm", ["lint", CHART], { stdio: "ignore" });
    execFileSync(
      "helm",
      [
        "lint",
        CHART,
        "-f",
        path.join(CHART, "values-cloud.yaml"),
        "-f",
        path.join(CHART, "values-observability.yaml")
      ],
      { stdio: "ignore" }
    );
    execFileSync(
      "helm",
      [
        "lint",
        CHART,
        "--set",
        "regionAgent.enabled=true,autopilot.enabled=true"
      ],
      { stdio: "ignore" }
    );
  });

  it("renders only the data plane by default", function () {
    const objs = render();
    expect(find(objs, "Deployment", "fonoster-gateway")).to.exist;
    expect(find(objs, "StatefulSet", "fonoster-medianode")).to.exist;
    expect(find(objs, "Deployment", "fonoster-apiserver")).to.not.exist;
    expect(find(objs, "StatefulSet", "fonoster-nats")).to.not.exist;
  });

  it("media nodes accept INVITEs only from trusted sources by default and refuse to render open (H9)", function () {
    // The media node's config file, from the chart's ConfigMap.
    const trustedOf = (objs: K8sObject[]) => {
      const cm = find(objs, "ConfigMap", "fonoster-medianode");
      const cfg = parseAllDocuments(
        cm?.data?.["medianode.yaml"] ?? ""
      )[0]?.toJS() as { trustedSources?: string[] } | undefined;
      return cfg?.trustedSources;
    };
    const trusted = trustedOf(render());
    expect(trusted, "a default trusted-sources list").to.be.an("array").that.is
      .not.empty;
    expect(trusted).to.not.include("0.0.0.0/0");
    expect(() =>
      execFileSync(
        "helm",
        ["template", "fonoster", CHART, "--set=medianode.trustedSources="],
        { stdio: "pipe" }
      )
    ).to.throw(/trustedSources is empty/);
    expect(
      trustedOf(
        render(
          "--set=medianode.trustedSources=",
          "--set=medianode.allowAnySource=true"
        )
      )
    ).to.equal(undefined);
  });

  it("renders every deployable of the cloud install, with a migrations Job", function () {
    const objs = render("values-cloud.yaml");
    [
      ["Deployment", "fonoster-apiserver"],
      ["Job", "fonoster-apiserver-migrate-1"],
      ["Deployment", "fonoster-dashboard"],
      ["Deployment", "fonoster-envoy"],
      ["Deployment", "fonoster-autopilot"],
      ["Deployment", "fonoster-gateway"],
      ["StatefulSet", "fonoster-medianode"],
      ["StatefulSet", "fonoster-nats"],
      ["StatefulSet", "fonoster-postgres"],
      ["StatefulSet", "fonoster-minio"]
    ].forEach(
      ([kind, name]) =>
        expect(find(objs, kind, name), `${kind}/${name}`).to.exist
    );
    const envoy = find(objs, "ConfigMap", "fonoster-envoy")!.data![
      "envoy.yaml"
    ];
    expect(envoy).to.contain("address: fonoster-apiserver");
    expect(envoy).to.contain("address: fonoster-dashboard");
    // CORS (M9): no wildcard; only the configured origins, none by default.
    expect(envoy).to.not.contain('prefix: "*"');
    expect(envoy).to.contain('- exact: "__CORS_ALLOWED_ORIGINS__"');
    const allowed = find(
      render(
        "values-cloud.yaml",
        "--set=envoy.corsAllowedOrigins={https://app.example.com,https://b.example.com}"
      ),
      "ConfigMap",
      "fonoster-envoy"
    )!.data!["envoy.yaml"];
    expect(allowed).to.match(
      /allow_origin_string_match:\n\s+- exact: "https:\/\/app\.example\.com"\n\s+- exact: "https:\/\/b\.example\.com"\n/
    );
    expect(allowed).to.not.contain("__CORS_ALLOWED_ORIGINS__");
  });

  it("never renders a raw secret: config secrets are secret:// references", function () {
    const objs = render("values-cloud.yaml", "values-observability.yaml");
    const text = JSON.stringify(objs);
    expect(text).to.not.match(/change-me/);
    const configs = objs.filter((o) => o.kind === "ConfigMap");
    const secretish = /(password|secret|secretAccessKey|accessKeyId|token)$/i;
    const walk = (v: unknown, key: string, where: string) => {
      if (typeof v === "string" && secretish.test(key) && v !== "unused")
        expect(v, where).to.match(/^secret:\/\//);
      else if (v && typeof v === "object")
        Object.entries(v).forEach(([k, x]) => walk(x, k, `${where}.${k}`));
    };
    ["fonoster-apiserver", "fonoster-gateway"].forEach((name) => {
      const cm = configs.find((c) => c.metadata.name === name)!;
      const file = Object.keys(cm.data!).find((k) => k.endsWith(".yaml"))!;
      walk(parseAllDocuments(cm.data![file])[0].toJS(), "", name);
    });
  });

  it("points every service at the chart's collector with the observability profile", function () {
    const objs = render("values-cloud.yaml", "values-observability.yaml");
    expect(find(objs, "Deployment", "fonoster-otel-collector")).to.exist;
    expect(find(objs, "Deployment", "fonoster-grafana")).to.exist;
    const text = JSON.stringify(find(objs, "Deployment", "fonoster-gateway"));
    expect(text).to.contain("http://fonoster-otel-collector:4318");
    const cm = find(objs, "ConfigMap", "fonoster-observability")!.data!;
    expect(cm["otel-collector.yaml"]).to.contain("fonoster-tempo:4317");
    expect(cm["datasources.yaml"]).to.contain("http://fonoster-loki:3100");
  });

  it("loads the rendered configs through each service's loader with mounted Secrets", function () {
    const objs = render("values-cloud.yaml");
    const secretsDir = fakeSecretsDir();
    const work = fs.mkdtempSync(path.join(os.tmpdir(), "helm-configs-"));
    const write = (cm: string, key: string) => {
      const file = path.join(work, key);
      fs.writeFileSync(file, find(objs, "ConfigMap", cm)!.data![key]);
      return file;
    };
    const env = {
      FONOSTER_SECRETS_DIR: secretsDir,
      POD_NAMESPACE: "default",
      // nats.auth (values-cloud): each service's password env from fonoster-nats-users.
      NATS_APISERVER_PASSWORD: "nats-api",
      NATS_GATEWAY_PASSWORD: "nats-gw",
      // The pods' env from the database Secret (gateway and Autopilot `encryption.key`,
      // Autopilot's `database.url` placeholder).
      APISERVER_ENCRYPTION_KEY:
        "k1.aesgcm256.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      APISERVER_DATABASE_URL: "postgresql://u:p@db:5432/fonoster"
    };

    const api = loadServiceConfig({
      service: "apiserver",
      schema: fonosterConfigSchema,
      argv: [
        "node",
        "x",
        "--config",
        write("fonoster-apiserver", "fonoster.yaml")
      ],
      env
    });
    expect(api.database.url).to.equal("postgresql://u:p@db:5432/fonoster");
    expect(api.apps.autopilotSigningSecret).to.equal("ap-secret");
    expect(api.nats).to.deep.equal({
      url: "nats://fonoster-nats:4222",
      user: "apiserver",
      password: "nats-api"
    });

    const saved = { ...process.env };
    Object.assign(process.env, env, { POD_IP: "10.1.2.3" });
    try {
      const gw = loadGatewayConfig(write("fonoster-gateway", "gateway.yaml"));
      expect(providerKey(gw.providers.deepgram)).to.equal("dg-key");
      expect(gw.rtp?.advertiseHost).to.equal("10.1.2.3");
      expect(gw.database?.url).to.equal("postgresql://u:p@db:5432/fonoster");
      expect(gw.nats).to.include({ user: "gateway", password: "nats-gw" });
      expect(gw.encryption?.key).to.equal(env.APISERVER_ENCRYPTION_KEY);
      const ap = loadHostedConfig(
        write("fonoster-autopilot", "autopilot-session.yaml")
      );
      expect(ap.port).to.equal(3000);
      expect(ap.database?.url).to.equal("postgresql://u:p@db:5432/fonoster");
      // Autopilot checks signatures against the URL the apps get, never the Host header.
      expect(ap.publicUrl).to.equal(api.apps.autopilotUrl);
      expect(ap.publicUrl).to.equal("ws://fonoster-autopilot:3000");
    } finally {
      process.env = saved;
    }
  });

  it("renders a private cell's agent config that the agent loads", function () {
    const objs = render("--set=regionAgent.enabled=true");
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "helm-agent-")),
      "region-agent.yaml"
    );
    fs.writeFileSync(
      file,
      find(objs, "ConfigMap", "fonoster-region-agent")!.data![
        "region-agent.yaml"
      ]
    );
    // nats.auth (on by default): the agent's password comes from the pod's environment.
    const saved = process.env.NATS_REGION_AGENT_PASSWORD;
    process.env.NATS_REGION_AGENT_PASSWORD = "n0123456789abcdef";
    try {
      expect(loadAgentConfig(file).nats.url).to.equal("nats://nats:4222");
    } finally {
      if (saved === undefined) delete process.env.NATS_REGION_AGENT_PASSWORD;
      else process.env.NATS_REGION_AGENT_PASSWORD = saved;
    }
  });

  it("gives every service its NATS user and the chart's NATS the users (nats.auth)", function () {
    const objs = render("values-cloud.yaml", "--set=regionAgent.enabled=true");
    const conf = find(objs, "ConfigMap", "fonoster-nats")!.data!;
    ["apiserver", "gateway", "medianode", "routr", "region-agent"].forEach(
      (u) => {
        expect(conf["nats.conf"]).to.contain(`{ user: ${u}, password: $NATS_`);
        expect(conf[`permissions-${u}.conf`], u).to.equal(
          fs.readFileSync(
            path.join(ROOT, "ops/rebuild/config/nats-permissions", `${u}.conf`),
            "utf8"
          )
        );
      }
    );
    const env = (kind: string, name: string) =>
      JSON.stringify(find(objs, kind, name)!.spec);
    expect(env("StatefulSet", "fonoster-nats")).to.contain(
      '"name":"NATS_ROUTR_PASSWORD"'
    );
    expect(env("Deployment", "fonoster-gateway")).to.contain(
      '"name":"NATS_GATEWAY_PASSWORD","valueFrom":{"secretKeyRef":{"name":"fonoster-nats-users","key":"gateway"}}'
    );
    expect(env("StatefulSet", "fonoster-medianode")).to.contain(
      '"name":"NATS_MEDIANODE_PASSWORD","valueFrom":{"secretKeyRef":{"name":"fonoster-nats-users","key":"medianode"}}'
    );
    expect(medianodeConfig(objs).nats).to.deep.equal({
      url: "nats://fonoster-nats:4222",
      user: "medianode",
      password: "secret://env/NATS_MEDIANODE_PASSWORD"
    });
    const agent = parseAllDocuments(
      find(objs, "ConfigMap", "fonoster-region-agent")!.data![
        "region-agent.yaml"
      ]
    )[0].toJS();
    expect(agent.nats).to.deep.equal({
      url: "nats://fonoster-nats:4222",
      user: "region-agent",
      password: "secret://env/NATS_REGION_AGENT_PASSWORD"
    });
    // The default data plane has NATS users too (M8)...
    const gatewayNats = (objs: K8sObject[]) =>
      parseAllDocuments(
        find(objs, "ConfigMap", "fonoster-gateway")!.data!["gateway.yaml"]
      )[0].toJS().nats;
    expect(gatewayNats(render())).to.deep.equal({
      url: "nats://nats:4222",
      user: "gateway",
      password: "secret://env/NATS_GATEWAY_PASSWORD"
    });
    // ...and turning auth off must be explicit.
    expect(() =>
      execFileSync(
        "helm",
        ["template", "fonoster", CHART, "--set=nats.auth.enabled=false"],
        { stdio: "pipe" }
      )
    ).to.throw(/allowUnauthenticated/);
    expect(
      gatewayNats(
        render(
          "--set=nats.auth.enabled=false",
          "--set=nats.auth.allowUnauthenticated=true"
        )
      )
    ).to.deep.equal({ url: "nats://nats:4222" });
  });

  it("renders workspaceKeysFromCloud for a public region's gateway (add-private-regions 5.9)", function () {
    const gatewayConfig = (...args: string[]) =>
      parseAllDocuments(
        find(render(...args), "ConfigMap", "fonoster-gateway")!.data![
          "gateway.yaml"
        ]
      )[0].toJS();
    expect(
      gatewayConfig(
        "--set=regionAgent.enabled=true,regionAgent.workspaceKeysFromCloud=true"
      ).cellSecrets
    ).to.deep.equal({
      dir: "/var/lib/fonoster-secrets",
      workspaceKeysFromCloud: true
    });
    expect(
      gatewayConfig("--set=regionAgent.enabled=true").cellSecrets
    ).to.deep.equal({ dir: "/var/lib/fonoster-secrets" });
    expect(gatewayConfig().cellSecrets).to.equal(undefined);
  });

  it("renders the media nodes' mutual TLS toward the edge (add-platform 4.2)", function () {
    const objs = render("--set=medianode.tls.enabled=true");
    expect(medianodeConfig(objs).tls).to.deep.equal({
      listen: "0.0.0.0:5061",
      cert: "/etc/medianode/tls/tls.crt",
      key: "/etc/medianode/tls/tls.key",
      ca: "/etc/medianode/tls/ca.crt",
      clientCa: "/etc/medianode/tls/ca.crt"
    });
    expect(
      JSON.stringify(find(objs, "StatefulSet", "fonoster-medianode")!.spec)
    ).to.contain('"secretName":"medianode-tls"');
    expect(medianodeConfig(render()).tls).to.equal(undefined);
  });

  // fix-config-and-placement-gaps: the node reads no MEDIANODE_* variables, so the chart passes
  // everything in medianode.yaml, with the pod's own values as ${VAR} placeholders.
  it("configures the media nodes through medianode.yaml, not MEDIANODE_* variables", function () {
    const objs = render("--set=medianode.trustedSources=10.0.0.1");
    const node = find(objs, "StatefulSet", "fonoster-medianode")!;
    // (NATS_MEDIANODE_PASSWORD is the node's NATS password, nats.auth.)
    expect(JSON.stringify(node)).to.not.match(/"MEDIANODE_|\$\{MEDIANODE_/);
    expect(JSON.stringify(node.spec)).to.contain(
      '"mountPath":"/config/medianode.yaml","subPath":"medianode.yaml"'
    );
    const config = medianodeConfig(objs);
    expect(config.nodeId).to.equal("${POD_NAME}");
    expect(config.sip).to.deep.equal({
      listen: "0.0.0.0:5060",
      advertise: "${HOST_IP}"
    });
    expect(config.rtp).to.deep.equal({
      host: "0.0.0.0",
      advertise: "${HOST_IP}",
      portMin: 30000,
      portMax: 30199
    });
    expect(config.registration).to.deep.equal({
      registrar: "routr:5060",
      domain: "nodes.fonoster.local",
      username: "${POD_NAME}",
      password: "${ROUTR_PEER_PASSWORD:-}"
    });
    expect(config.trustedSources).to.deep.equal(["10.0.0.1"]);
    // Every placeholder is a variable the pod sets.
    const env = JSON.stringify(node.spec);
    ["POD_NAME", "HOST_IP", "ROUTR_PEER_PASSWORD"].forEach((v) =>
      expect(env, v).to.contain(`"name":"${v}"`)
    );
  });

  it("keeps the chart's copies of the Compose configs in sync", function () {
    const same = (a: string, b: string) =>
      expect(fs.readFileSync(path.join(CHART, "files", a), "utf8"), a).to.equal(
        fs.readFileSync(path.join(ROOT, b), "utf8")
      );
    same("envoy.yaml", "config/envoy.yaml");
    [
      "otel-collector.yaml",
      "prometheus.yml",
      "loki.yaml",
      "tempo.yaml"
    ].forEach((f) => same(`observability/${f}`, `ops/rebuild/config/${f}`));
    same(
      "observability/grafana-datasources.yaml",
      "ops/rebuild/config/grafana/datasources.yaml"
    );
    const perms = path.join(ROOT, "ops/rebuild/config/nats-permissions");
    expect(
      fs.readdirSync(path.join(CHART, "files", "nats-permissions"))
    ).to.deep.equal(fs.readdirSync(perms));
    fs.readdirSync(perms).forEach((f) =>
      same(`nats-permissions/${f}`, `ops/rebuild/config/nats-permissions/${f}`)
    );
  });
});
