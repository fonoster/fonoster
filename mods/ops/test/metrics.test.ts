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
import { execFileSync } from "child_process";
import { randomBytes } from "crypto";
import * as fs from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import * as os from "os";
import * as path from "path";
import { URL } from "url";
import { getLogger } from "@fonoster/logger";
import Ajv2020 from "ajv/dist/2020";
import { expect } from "chai";
import express from "express";
import { Client } from "pg";
import * as sinon from "sinon";
import { createOps } from "../src";
import { connectReadOnly } from "../src/metrics/readSnapshot";

// Real migrated databases: a migration that renames a column turns these red. The tables come from
// `prisma migrate deploy`, only the rows from test/fixtures; Routr's schema isn't in this repository.

const BASE = process.env.PERSISTENCE_TEST_DATABASE_URL;
const MODS = path.resolve(__dirname, "../..");
const PRISMA = path.resolve(MODS, "../node_modules/.bin/prisma");
const TOKEN = `s${"0123456789abcdef".repeat(2)}`;
const SCHEMAS: Record<string, [string, string]> = {
  fonoster: ["apiserver", "APISERVER_DATABASE_URL"],
  identity: ["identity", "APISERVER_IDENTITY_DATABASE_URL"],
  billing: ["billing", "BILLING_DATABASE_URL"]
};

describe("@ops/metrics", function () {
  this.timeout(120_000);

  const suffix = randomBytes(5).toString("hex");
  const names = {
    fonoster: `ops_fonoster_${suffix}`,
    identity: `ops_identity_${suffix}`,
    routr: `ops_routr_${suffix}`,
    billing: `ops_billing_${suffix}`
  };
  type Key = keyof typeof names;
  const keys = Object.keys(names) as Key[];
  const urlOf = (name: string) => {
    const u = new URL(BASE!);
    u.pathname = `/${name}`;
    return u.toString();
  };
  const databases = () =>
    Object.fromEntries(keys.map((k) => [k, urlOf(names[k])])) as Record<
      Key,
      string
    >;

  let admin: Client;
  const servers: http.Server[] = [];
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "ops-metrics-"));

  const serve = (dbs: Record<Key, string>) =>
    new Promise<number>((resolve) => {
      const app = express();
      app.use(
        "/api/ops",
        createOps({
          secret: TOKEN,
          intervalMinutes: 5,
          stateDir,
          tracesDir: stateDir,
          databases: dbs
        }).router
      );
      const server = app.listen(0, "127.0.0.1", () => {
        servers.push(server);
        resolve((server.address() as AddressInfo).port);
      });
    });
  const metrics = async (port: number) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/ops/metrics`, {
      headers: { authorization: `Bearer ${TOKEN}` }
    });
    return { status: res.status, text: await res.text() };
  };
  const seed = async (name: string, file: string) => {
    const client = new Client({ connectionString: urlOf(name) });
    await client.connect();
    await client.query(
      fs.readFileSync(path.join(__dirname, "fixtures", file), "utf8")
    );
    await client.end();
  };

  before(async function () {
    if (!BASE) this.skip();
    admin = new Client({ connectionString: BASE });
    await admin.connect();
    for (const key of keys) await admin.query(`CREATE DATABASE ${names[key]}`);
    for (const [key, [pkg, env]] of Object.entries(SCHEMAS)) {
      const cwd = path.join(MODS, pkg);
      execFileSync(
        PRISMA,
        ["migrate", "deploy", "--schema", path.join(cwd, "schema.prisma")],
        {
          stdio: "pipe",
          cwd,
          env: {
            ...process.env,
            [env]: urlOf(names[key as Key]),
            PRISMA_HIDE_UPDATE_MESSAGE: "1"
          }
        }
      );
    }
    await seed(names.identity, "identity.sql");
    await seed(names.fonoster, "fonoster.sql");
    await seed(names.routr, "routr.sql");
    await seed(names.billing, "billing.sql");
  });

  afterEach(function () {
    sinon.restore();
  });

  after(async function () {
    servers.forEach((s) => s.close());
    fs.rmSync(stateDir, { recursive: true, force: true });
    if (!admin) return;
    for (const key of keys) {
      await admin.query(`DROP DATABASE IF EXISTS ${names[key]} WITH (FORCE)`);
    }
    await admin.end();
  });

  it("[API-073] reads one snapshot of schema 1 with the expected numbers", async function () {
    const res = await metrics(await serve(databases()));
    expect(res.status, res.text).to.equal(200);
    const s = JSON.parse(res.text);

    const schema = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../schema/snapshot.v1.json"),
        "utf8"
      )
    );
    const validate = new Ajv2020({ strict: false }).compile(schema);
    expect(validate(s), JSON.stringify(validate.errors)).to.equal(true);

    expect(s.schema).to.equal(1);
    expect(s.users).to.deep.equal({
      total: 6,
      verified: 4,
      password: 4,
      github: 2,
      new_24h: 2,
      new_7d: 4,
      verified_new_24h: 1,
      verified_new_7d: 3
    });
    expect(s.workspaces).to.deep.equal({
      total: 4,
      new_24h: 1,
      new_7d: 3,
      active_7d: 4,
      activated_7d: 1,
      activated_loose_7d: 3,
      activated_total: 2
    });
    expect(s.apps).to.deep.equal({
      total: 4,
      autopilot: 3,
      stream: 1,
      new_7d: 2
    });
    expect(s.routr).to.deep.equal({
      agents: 3,
      numbers: 2,
      trunks: 1,
      domains: 2,
      new_7d: { agents: 1, numbers: 1, trunks: 0 }
    });
    const { by_status_24h: byStatus, ...calls } = s.calls;
    expect(calls).to.deep.equal({
      total: 8,
      h1: 1,
      h24: 4,
      d7: 7,
      minutes_24h: 3,
      avg_secs_24h: 46,
      under5s_24h: 2,
      inbound_24h: 1,
      outbound_24h: 2,
      workspaces_24h: 2
    });
    expect(byStatus).to.deep.equal({ completed: 2, erased: 1, failed: 1 });
    expect(s.billing).to.deep.equal({
      present: 1,
      accounts: 6,
      trial: 3,
      payg: 3,
      past_due: 1,
      converted: 3,
      converted_24h: 1,
      converted_7d: 2,
      credits_purchased: 8500,
      credits_purchased_used: 1030,
      credits_free: 1200,
      credits_free_used: 300,
      credits_overdraft: 50,
      credits_expired: 500
    });
    Object.values(s.daily).forEach((series) =>
      expect(series).to.have.length(14)
    );
    const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
    expect([
      s.daily.signups[13],
      s.daily.signups[10],
      sum(s.daily.signups)
    ]).to.deep.equal([2, 2, 4]);
    expect([
      s.daily.verified[13],
      s.daily.verified[10],
      sum(s.daily.verified)
    ]).to.deep.equal([1, 2, 3]);
    expect(sum(s.daily.calls)).to.equal(7);
    expect([
      s.daily.converted[13],
      s.daily.converted[10],
      sum(s.daily.converted)
    ]).to.deep.equal([1, 1, 2]);
  });

  it("[API-073] answers 503 with no detail when a database doesn't exist", async function () {
    const missing = `ops_missing_${suffix}`;
    const error = sinon.stub(
      getLogger({ service: "ops", filePath: __filename }),
      "error"
    );
    const port = await serve({ ...databases(), routr: urlOf(missing) });
    const res = await metrics(port);
    expect(res.status).to.equal(503);
    const body = JSON.parse(res.text);
    expect(Object.keys(body).sort()).to.deep.equal(["error", "schema", "ts"]);
    expect(body.schema).to.equal(1);
    expect(body.error).to.equal("query_failed");
    expect(body.ts).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(error.firstCall.args).to.deep.equal([
      "ops: metrics query failed: features.ops.databases.routr"
    ]);
    const u = new URL(BASE!);
    const said = `${res.text}\n${JSON.stringify(error.args)}`;
    [missing, u.hostname, u.username].forEach((detail) =>
      expect(said).to.not.include(detail)
    );
  });

  it("[API-073] can't write through its connection, even as a superuser", async function () {
    const client = await connectReadOnly(urlOf(names.identity));
    let code: string | undefined;
    try {
      await client.query("CREATE TABLE ops_write_attempt (id int)");
    } catch (e) {
      code = (e as { code?: string }).code;
    } finally {
      await client.end();
    }
    expect(code).to.equal("25006");
  });

  it("[API-073] holds no connection after failed requests", async function () {
    const opened = async () =>
      Number(
        (
          await admin.query(
            "SELECT count(*) AS n FROM pg_stat_activity WHERE datname = $1",
            [names.identity]
          )
        ).rows[0].n
      );
    const baseline = await opened();
    // Identity connects and answers; the next database fails the request.
    const port = await serve({
      ...databases(),
      fonoster: urlOf(`ops_missing_${suffix}`)
    });
    sinon.stub(getLogger({ service: "ops", filePath: __filename }), "error");
    for (let i = 0; i < 20; i++) {
      expect((await metrics(port)).status).to.equal(503);
    }
    let now = await opened();
    for (let i = 0; i < 50 && now > baseline; i++) {
      await new Promise((r) => setTimeout(r, 100));
      now = await opened();
    }
    expect(now).to.equal(baseline);
  });
});
