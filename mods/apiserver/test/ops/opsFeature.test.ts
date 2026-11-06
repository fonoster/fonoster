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
import { readFileSync } from "fs";
import { join } from "path";
import { parseConfigFile } from "@fonoster/common";
import { expect } from "chai";
import { fonosterConfigSchema } from "../../src/config/schema";
import { loadOps } from "../../src/core/loadOps";

const SECRET = `s${"0123456789abcdef".repeat(2)}`;
const DATABASES = {
  fonoster: "postgresql://ops@db/fonoster",
  identity: "postgresql://ops@db/fnidentity",
  routr: "postgresql://ops@db/routr",
  billing: "postgresql://ops@db/billing"
};

const fixture = join(__dirname, "..", "fixtures", "fonoster.test.yaml");
const base = parseConfigFile(fixture, readFileSync(fixture, "utf8")) as Record<
  string,
  unknown
>;
const parse = (ops?: Record<string, unknown>) =>
  fonosterConfigSchema.safeParse({
    ...base,
    ...(ops ? { features: { ops } } : {})
  });
const issues = (parsed: ReturnType<typeof parse>) =>
  parsed.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
const opsLoaded = () =>
  Object.keys(require.cache).some((k) => k.includes("/mods/ops/dist/"));

describe("@apiserver[ops]", function () {
  describe("features.ops", function () {
    it("is off with no key, and passes with enabled absent and no secret", function () {
      const absent = parse();
      expect(absent.success, JSON.stringify(absent.error?.issues)).to.equal(
        true
      );
      expect(absent.data!.features.ops.enabled).to.equal(false);
      expect(parse({ interop: { intervalMinutes: 1 } }).success).to.equal(true);
    });

    it("defaults the interval to 5 minutes", function () {
      const parsed = parse({
        enabled: true,
        secret: SECRET,
        databases: DATABASES
      });
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).to.equal(
        true
      );
      expect(parsed.data!.features.ops.interop.intervalMinutes).to.equal(5);
    });

    it("refuses an interval that isn't a positive integer", function () {
      [0, -1, 1.5].forEach((intervalMinutes) => {
        expect(parse({ interop: { intervalMinutes } }).success).to.equal(false);
      });
    });

    it("refuses enabled with no secret, at features.ops.secret", function () {
      const parsed = parse({ enabled: true, databases: DATABASES });
      expect(parsed.success).to.equal(false);
      expect(issues(parsed)).to.have.length(1);
      expect(issues(parsed)[0]).to.match(/^features\.ops\.secret: /);
    });

    it("refuses a malformed secret without printing it", function () {
      const bad = "not-the-right-shape-of-a-secret";
      const parsed = parse({
        enabled: true,
        secret: bad,
        databases: DATABASES
      });
      expect(parsed.success).to.equal(false);
      expect(issues(parsed)).to.have.length(1);
      expect(issues(parsed)[0]).to.match(/^features\.ops\.secret: /);
      expect(JSON.stringify(parsed.error!.issues)).to.not.include(bad);
    });

    it("refuses enabled with routr missing, at features.ops.databases.routr", function () {
      const { routr: _routr, ...databases } = DATABASES;
      const parsed = parse({ enabled: true, secret: SECRET, databases });
      expect(parsed.success).to.equal(false);
      expect(issues(parsed)).to.have.length(1);
      expect(issues(parsed)[0]).to.match(/^features\.ops\.databases\.routr: /);
    });

    it("names each missing database", function () {
      const parsed = parse({ enabled: true, secret: SECRET });
      expect(
        issues(parsed).map((line) => line.split(":")[0])
      ).to.deep.equal([
        "features.ops.databases.fonoster",
        "features.ops.databases.identity",
        "features.ops.databases.routr",
        "features.ops.databases.billing"
      ]);
    });
  });

  describe("loadOps", function () {
    it("returns no routers and doesn't load @fonoster/ops when off", async function () {
      const parsed = parse();
      const ops = await loadOps(parsed.data!.features.ops);
      expect(ops.routers).to.deep.equal([]);
      ops.start();
      expect(opsLoaded()).to.equal(false);
    });

    it("mounts /api/ops when on", async function () {
      const parsed = parse({
        enabled: true,
        secret: SECRET,
        databases: DATABASES
      });
      const ops = await loadOps(parsed.data!.features.ops);
      expect(ops.routers.map((r) => r.path)).to.deep.equal(["/api/ops"]);
      expect(ops.routers[0].router).to.be.a("function");
    });
  });
});
