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
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import { billingConfigSchema } from "../../../mods/billing/src/config";

// Billing is Fonoster Cloud only (#1273): the install archive ships none of it and docs-site
// documents none of it. Production gets it from its inventory (fonoster_files, fonoster_inserts),
// copied from the reference files in ops/cloud.

const BUNDLE = path.join(__dirname, "..");
const ROOT = path.join(BUNDLE, "..", "..");
const repo = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const yaml = (p: string) => parse(repo(p));

/** Every file under dir, minus the paths in skip (relative to dir). */
function files(dir: string, skip: string[] = [], base = dir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (skip.includes(path.relative(base, p))) return [];
    return e.isDirectory() ? files(p, skip, base) : [p];
  });
}

/** What ops/release/bundle puts in the archive: ops/bundle, and ops/ansible as ansible/. */
function shipped(): { name: string; text: string }[] {
  const ansible = path.join(ROOT, "ops/ansible");
  return [
    ...files(BUNDLE, [".env", "config/keys", "config/tls", "test"]).map(
      (f) => ({ name: path.relative(BUNDLE, f), file: f })
    ),
    ...files(ansible, ["inventory", "test", ".ansible"]).map((f) => ({
      name: path.join("ansible", path.relative(ansible, f)),
      file: f
    }))
  ].map(({ name, file }) => ({ name, text: fs.readFileSync(file, "utf8") }));
}

type Insert = { before?: string; after?: string; lines: string };
const inserts = () => yaml("ops/cloud/inserts.yml") as Record<string, Insert[]>;

describe("@bundle[billing is Fonoster Cloud only]", function () {
  it("ships nothing that names billing or Stripe", function () {
    const named = shipped().flatMap(({ name, text }) => [
      ...(/billing|stripe/i.test(name) ? [name] : []),
      ...text
        .split("\n")
        .map((line, i) => ({ line, at: `${name}:${i + 1}` }))
        .filter(({ line }) => /billing|stripe/i.test(line))
        // The apiserver's own publish permission (its code is in the public image).
        .filter(
          ({ line }) =>
            !(
              name === "config/nats-permissions/apiserver.conf" &&
              /^\s*"billing\.usage\.>"$/.test(line)
            )
        )
        .map(({ at }) => at)
    ]);
    expect(named).to.deep.equal([]);
  });

  it("documents no billing setup on the public docs", function () {
    const docs = path.join(ROOT, "docs-site");
    expect(fs.existsSync(path.join(docs, "workspace/billing.mdx"))).to.equal(
      false
    );
    const setup =
      /workspace\/billing|compose\.billing|NATS_BILLING_PASSWORD|BILLING_DATABASE_URL|stripe\/webhooks|features\.billing|CREATE DATABASE billing/;
    const named = files(docs, ["node_modules"])
      .filter((f) => /\.(md|mdx|json)$/.test(f))
      .filter((f) => setup.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(docs, f));
    expect(named).to.deep.equal([]);
  });

  it("names neither the test stack nor its variables in anything the archive ships", function () {
    const named = shipped()
      .filter(({ text }) => /rebuild|RB_/i.test(text))
      .map(({ name }) => name);
    expect(named).to.deep.equal([]);
  });
});

describe("@bundle[ops/cloud, billing's reference files]", function () {
  it("anchors every insert on exactly one line of the bundle's file", function () {
    for (const [file, list] of Object.entries(inserts())) {
      const lines = repo(`ops/bundle/${file}`).split("\n");
      for (const insert of list) {
        const anchor = insert.before ?? insert.after;
        expect(anchor, `${file}: before or after`).to.be.a("string");
        const matches = lines.filter((l) => new RegExp(anchor!).test(l));
        expect(matches, `${file}: ${anchor}`).to.have.length(1);
      }
    }
  });

  it("adds to the bundle's nats.conf exactly the billing lines the rebuild stack's has", function () {
    const added = inserts()["config/nats.conf"].flatMap((i) =>
      i.lines
        .trimEnd()
        .split("\n")
        .map((l) => l.trim())
    );
    const body = (text: string) =>
      text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "" && !l.startsWith("#"));
    const rebuild = body(repo("ops/rebuild/config/nats.conf"));
    for (const line of added) expect(rebuild, line).to.include(line);
    expect(rebuild.filter((l) => !added.includes(l))).to.deep.equal(
      body(repo("ops/bundle/config/nats.conf"))
    );
  });

  it("routes Stripe's webhooks to billing before Envoy's / matches", function () {
    const envoy = inserts()["config/envoy-tls.yaml"];
    const route = envoy.find((i) => i.before?.includes("Region-signing"))!;
    expect(parse(route.lines)).to.deep.equal([
      {
        match: { path: "/stripe/webhooks" },
        route: { cluster: "billing-cluster" }
      }
    ]);
    const lines = repo("ops/bundle/config/envoy-tls.yaml").split("\n");
    const at = lines.findIndex((l) => new RegExp(route.before!).test(l));
    expect(
      lines.findIndex((l, i) => i > at && /prefix: "\/"$/.test(l))
    ).to.be.greaterThan(at);
    const [cluster] = parse(
      envoy.find((i) => i.before?.includes("dashboard-cluster"))!.lines
    );
    expect(cluster.name).to.equal("billing-cluster");
    expect(
      cluster.load_assignment.endpoints[0].lb_endpoints[0].endpoint.address
        .socket_address
    ).to.deep.equal({ address: "billing", port_value: 50072 });
  });

  it("keeps a billing.yaml with the 7-day Trial and every secret as a ${NAME}", function () {
    const config = billingConfigSchema.parse(
      yaml("ops/cloud/config/billing.yaml")
    );
    expect(config.plans).to.include({ trialDays: 7, trialCredits: 1000 });
    expect(config.rateCards.dir).to.equal("/work/mods/billing/rate-cards");
    expect(config.stripe).to.include({
      secretKey: "${STRIPE_SECRET_KEY}",
      webhookSecret: "${STRIPE_WEBHOOK_SECRET}",
      automaticTax: true
    });
    expect(config.database.url).to.equal("${BILLING_DATABASE_URL}");
    expect(repo("ops/cloud/config/nats-permissions/billing.conf")).to.contain(
      "BILLING_PERMISSIONS = {"
    );
  });

  it("replaces the base catalog with Cloud's on the API server only", function () {
    const { services } = yaml("ops/cloud/compose.catalog.yaml");
    expect(Object.keys(services)).to.deep.equal(["apiserver"]);
    expect(services.apiserver.volumes).to.deep.equal([
      "${CONFIG_DIR:-./config}/catalog.cloud.yaml:/etc/fonoster/catalog.yaml:ro"
    ]);
  });

  it("offers in Cloud's catalog every id the base offers, and nothing retired", function () {
    // Cloud's rows may carry more (synced voice fields, more languages); the ids must stay, or
    // agents saved on the base ids break when production applies Cloud's file.
    type Entry = { id: string; state: string };
    const cloud = yaml("ops/cloud/config/catalog.yaml").entries as Entry[];
    const byId = new Map(cloud.map((e) => [e.id, e]));
    expect(byId.size).to.equal(cloud.length);
    expect(cloud.filter((e) => e.state !== "active")).to.deep.equal([]);
    for (const e of (
      yaml("ops/bundle/config/catalog.yaml").entries as Entry[]
    ).filter((e) => e.state === "active"))
      expect(byId.get(e.id)?.state, e.id).to.equal("active");
  });

  it("runs billing in its own billing database and passes NATS its password", function () {
    const { services } = yaml("ops/cloud/compose.billing.yaml");
    const { billing } = services;
    const url = billing.environment.BILLING_DATABASE_URL as string;
    expect(url).to.match(/@postgres:5432\/billing\}$/);
    expect(url).not.to.contain("schema=");
    expect(services.nats.environment.NATS_BILLING_PASSWORD).to.equal(
      "${NATS_BILLING_PASSWORD:?set NATS_BILLING_PASSWORD in .env}"
    );
    expect(billing.image).to.equal(
      "fonoster/billing:${FONOSTER_VERSION:?set FONOSTER_VERSION}"
    );
    expect(Object.keys(billing.depends_on).sort()).to.deep.equal([
      "apiserver",
      "nats"
    ]);
    expect(billing.environment.STRIPE_SECRET_KEY).to.equal(
      "${STRIPE_SECRET_KEY:?set STRIPE_SECRET_KEY in .env}"
    );
    expect(billing.healthcheck.test).to.deep.equal([
      "CMD",
      "node",
      "/work/mods/billing/dist/healthcheck.js"
    ]);
  });
});
