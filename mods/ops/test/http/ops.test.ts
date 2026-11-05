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
import * as fs from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import * as os from "os";
import * as path from "path";
import { getLogger } from "@fonoster/logger";
import { expect } from "chai";
import express from "express";
import * as sinon from "sinon";
import { createOps } from "../../src";

const TOKEN = `s${"0123456789abcdef".repeat(2)}`;
const WRONG = `s${"fedcba9876543210".repeat(2)}`;
const FIXTURE = path.join(
  __dirname,
  "../../../common/test/interop/fixtures/sipjs_wa-dod-invite_whatsapp_20261025.jsonl"
);
const FILE = "20261105T120000Z-a84bc1.jsonl";
const DATABASES = {
  fonoster: "postgresql://127.0.0.1:1/fonoster",
  identity: "postgresql://127.0.0.1:1/fnidentity",
  routr: "postgresql://127.0.0.1:1/routr",
  billing: "postgresql://127.0.0.1:1/billing"
};
const EVIDENCE = {
  found: {
    whatsapp: {
      "IOP-004": { file: FILE, time: "2026-11-05T14:00:00Z" }
    }
  },
  failures: {
    telnyx: {
      "488 to INVITE": {
        day: "2026-11-05",
        files: ["a-1.jsonl", "a-2.jsonl", "a-3.jsonl"],
        file: "a-3.jsonl",
        time: "2026-11-05T13:00:00Z"
      }
    }
  }
};

type Answer = {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  json: () => any;
};

describe("@ops/http", function () {
  let root: string;
  let traces: string;
  let state: string;
  let server: http.Server;
  let port: number;

  // Raw paths: fetch would normalize `../`.
  const send = (
    target: string,
    headers: Record<string, string> = { authorization: `Bearer ${TOKEN}` },
    method = "GET"
  ) =>
    new Promise<Answer>((resolve, reject) => {
      const req = http.request(
        { host: "127.0.0.1", port, path: target, method, headers },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const body = Buffer.concat(chunks);
            resolve({
              status: res.statusCode!,
              headers: res.headers,
              body,
              json: () => JSON.parse(body.toString())
            });
          });
        }
      );
      req.on("error", reject);
      req.end();
    });

  const serve = (config = {}) => {
    const ops = createOps({
      secret: TOKEN,
      intervalMinutes: 5,
      tracesDir: traces,
      stateDir: state,
      databases: DATABASES,
      ...config
    });
    const app = express();
    app.use("/api/ops", ops.router);
    return new Promise<typeof ops>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        port = (server.address() as AddressInfo).port;
        resolve(ops);
      });
    });
  };

  const writeState = (s: object) =>
    fs.writeFileSync(path.join(state, "state.json"), JSON.stringify(s));

  const until = async (check: () => Promise<boolean>) => {
    for (let i = 0; i < 2000; i++) {
      if (await check()) return;
      await new Promise((r) => setImmediate(r));
    }
    throw new Error("the condition never held");
  };

  beforeEach(function () {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ops-http-"));
    traces = path.join(root, "traces");
    state = path.join(root, "state");
    fs.mkdirSync(traces);
    fs.mkdirSync(state);
  });

  afterEach(function (done) {
    sinon.restore();
    fs.rmSync(root, { recursive: true, force: true });
    server.close(() => done());
  });

  describe("the bearer", function () {
    const answers: [string, Record<string, string>][] = [
      ["no Authorization", {}],
      ["an empty token", { authorization: "Bearer " }],
      ["a wrong token of the same length", { authorization: `Bearer ${WRONG}` }],
      ["a wrong token of another length", { authorization: "Bearer short" }],
      ["another scheme", { authorization: `Basic ${TOKEN}` }]
    ];
    const targets = [
      "/api/ops/interop/alerts",
      `/api/ops/interop/recordings/${FILE}`,
      "/api/ops/nothing/here"
    ];

    answers.forEach(([name, headers]) => {
      targets.forEach((target) => {
        it(`answers 401 to ${name} on ${target}`, async function () {
          await serve();
          const res = await send(target, headers);
          expect(res.status).to.equal(401);
          expect(res.headers["www-authenticate"]).to.equal("Bearer");
          expect(res.json()).to.deep.equal({ error: "unauthorized" });
        });
      });
    });

    it("checks it on any method", async function () {
      await serve();
      const res = await send("/api/ops/interop/alerts", {}, "POST");
      expect(res.status).to.equal(401);
    });

    it("only counts the Authorization header", async function () {
      await serve();
      const res = await send(`/api/ops/interop/alerts?token=${TOKEN}`, {
        cookie: `token=${TOKEN}`,
        "x-token": TOKEN
      });
      expect(res.status).to.equal(401);
    });

    it("leaves any other path and method to Express's 404", async function () {
      await serve();
      expect((await send("/api/ops/nothing")).status).to.equal(404);
      const post = await send(
        "/api/ops/interop/alerts",
        { authorization: `Bearer ${TOKEN}` },
        "POST"
      );
      expect(post.status).to.equal(404);
    });
  });

  describe("GET /interop/alerts", function () {
    it("answers both alerts, the failure first, count being files.length", async function () {
      await serve();
      writeState(EVIDENCE);
      const res = await send("/api/ops/interop/alerts");
      expect(res.status).to.equal(200);
      expect(res.headers["content-type"]).to.match(/^application\/json/);
      expect(res.json()).to.deep.equal({
        alerts: [
          {
            kind: "failure",
            far_end: "telnyx",
            signature: "488 to INVITE",
            count: 3,
            time: "2026-11-05T13:00:00Z",
            file: "a-3.jsonl"
          },
          {
            kind: "evidence",
            far_end: "whatsapp",
            case: "IOP-004",
            time: "2026-11-05T14:00:00Z",
            file: FILE
          }
        ]
      });
    });

    it("lists each kind newest first", async function () {
      await serve();
      const found = (time: string) => ({ file: FILE, time });
      writeState({
        found: {
          whatsapp: {
            "IOP-004": found("2026-11-05T10:00:00Z"),
            "IOP-005": found("2026-11-05T11:00:00Z")
          }
        },
        failures: {}
      });
      const { alerts } = (await send("/api/ops/interop/alerts")).json();
      expect(alerts.map((a: { case: string }) => a.case)).to.deep.equal([
        "IOP-005",
        "IOP-004"
      ]);
    });

    it("answers no alerts with no state.json and no failed pass", async function () {
      await serve();
      const res = await send("/api/ops/interop/alerts");
      expect(res.status).to.equal(200);
      expect(res.json()).to.deep.equal({ alerts: [] });
    });

    it("answers 503 on a state.json it can't read", async function () {
      await serve();
      fs.writeFileSync(path.join(state, "state.json"), "not json");
      const res = await send("/api/ops/interop/alerts");
      expect(res.status).to.equal(503);
      expect(res.json()).to.deep.equal({ error: "scan_failed" });
    });

    it("answers 503 after a failed pass, with no unhandled rejection, and 200 after a good one", async function () {
      const rejections: unknown[] = [];
      const listen = (e: unknown) => rejections.push(e);
      process.on("unhandledRejection", listen);
      const error = sinon.stub(
        getLogger({ service: "ops", filePath: __filename }),
        "error"
      );
      const clock = sinon.useFakeTimers({ toFake: ["setTimeout"] });
      try {
        fs.rmdirSync(traces);
        const ops = await serve();
        ops.start();
        await until(
          async () => (await send("/api/ops/interop/alerts")).status === 503
        );
        const res = await send("/api/ops/interop/alerts");
        expect(res.json()).to.deep.equal({ error: "scan_failed" });
        expect(error.firstCall.args[0]).to.equal(
          `ops: interop scan failed: ${traces} ENOENT`
        );
        expect(rejections).to.deep.equal([]);

        fs.mkdirSync(traces);
        clock.tick(5 * 60_000);
        await until(
          async () => (await send("/api/ops/interop/alerts")).status === 200
        );
      } finally {
        clock.restore();
        process.off("unhandledRejection", listen);
      }
    });
  });

  describe("GET /interop/recordings/:file", function () {
    it("streams the same bytes as an attachment", async function () {
      await serve();
      fs.copyFileSync(FIXTURE, path.join(traces, FILE));
      const res = await send(`/api/ops/interop/recordings/${FILE}`);
      expect(res.status).to.equal(200);
      expect(res.headers["content-type"]).to.equal("application/x-ndjson");
      expect(res.headers["content-disposition"]).to.equal(
        `attachment; filename="${FILE}"`
      );
      expect(res.body.equals(fs.readFileSync(FIXTURE))).to.equal(true);
    });

    [
      ["raw", "../x.jsonl"],
      ["encoded", "..%2Fx.jsonl"],
      ["a missing name", FILE],
      ["a name that fails the pattern", "x.txt"],
      ["a bad escape", "%E0%A4%A.jsonl"]
    ].forEach(([name, file]) => {
      it(`answers 404 to ${name}`, async function () {
        await serve();
        fs.writeFileSync(path.join(root, "x.jsonl"), "outside");
        const res = await send(`/api/ops/interop/recordings/${file}`);
        expect(res.status).to.equal(404);
        expect(res.body.toString()).to.not.include("outside");
      });
    });

    it("answers not_found as JSON", async function () {
      await serve();
      const res = await send(`/api/ops/interop/recordings/${FILE}`);
      expect(res.json()).to.deep.equal({ error: "not_found" });
      const bad = await send("/api/ops/interop/recordings/%E0%A4%A.jsonl");
      expect(bad.json()).to.deep.equal({ error: "not_found" });
    });
  });
});
