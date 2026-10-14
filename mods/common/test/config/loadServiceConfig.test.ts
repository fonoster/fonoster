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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import { z } from "zod";
import { loadServiceConfig } from "../../src";

const schema = z.object({
  host: z.string().default("localhost"),
  port: z.number().default(5432),
  apiKey: z.string().optional(),
  database: z
    .object({ url: z.string().default("postgresql://localhost/db") })
    .default({})
});

describe("@common[config/loadServiceConfig]", function () {
  let dir: string;

  beforeEach(function () {
    dir = mkdtempSync(join(tmpdir(), "fonoster-cfg-"));
  });

  afterEach(function () {
    rmSync(dir, { recursive: true, force: true });
  });

  const write = (name: string, body: string) => {
    const path = join(dir, name);
    writeFileSync(path, body);
    return path;
  };

  const load = (argv: string[], extra: Record<string, unknown> = {}) =>
    loadServiceConfig({
      service: "svc",
      schema,
      argv: ["node", "svc", ...argv],
      env: {},
      searchDirs: [dir],
      ...extra
    });

  describe("finding the file", function () {
    it("loads the file given with --config", function () {
      const path = write("other.yaml", "host: db\nport: 6000\n");
      expect(load(["--config", path])).to.deep.equal({
        host: "db",
        port: 6000,
        database: { url: "postgresql://localhost/db" }
      });
    });

    it("finds <base>.yaml in a search directory", function () {
      write("svc.yaml", "host: from-dir\n");
      expect(load([]).host).to.equal("from-dir");
    });

    it("tries search directories in order", function () {
      const first = join(dir, "first");
      const second = join(dir, "second");
      mkdirSync(first);
      mkdirSync(second);
      writeFileSync(join(second, "svc.yaml"), "host: second\n");
      writeFileSync(join(first, "svc.yaml"), "host: first\n");
      expect(load([], { searchDirs: [first, second] }).host).to.equal("first");
    });

    it("refuses two files for the same service in one directory", function () {
      write("svc.yaml", "host: a\n");
      write("svc.jsonc", '{ "host": "b" }');
      expect(() => load([])).to.throw(/more than one svc config file/);
    });

    it("falls back to defaults when no file is found", function () {
      expect(load([]).host).to.equal("localhost");
    });

    it("ignores FONOSTER_CONFIG (services read no env of their own)", function () {
      const path = write("elsewhere.yaml", "host: from-env\n");
      expect(load([], { env: { FONOSTER_CONFIG: path } }).host).to.equal(
        "localhost"
      );
    });

    it("throws when the --config file is missing", function () {
      expect(() => load(["--config", join(dir, "nope.yaml")])).to.throw(
        /unable to read svc config at .*nope\.yaml: file not found/
      );
    });
  });

  describe("formats", function () {
    it("loads JSON with comments and trailing commas like YAML", function () {
      const yaml = write("a.yaml", "host: db\nport: 6000\n");
      const jsonc = write(
        "a.jsonc",
        '{\n  // the database host\n  "host": "db",\n  "port": 6000,\n}\n'
      );
      expect(load(["--config", jsonc])).to.deep.equal(
        load(["--config", yaml])
      );
    });

    it("ignores the editor-only $schema key", function () {
      const path = write(
        "svc.jsonc",
        '{ "$schema": "https://fonoster.com/schemas/svc.json", "host": "db" }'
      );
      expect(load(["--config", path]).host).to.equal("db");
    });

    it("reports line and column for malformed JSON", function () {
      const path = write("bad.json", '{\n  "host": "db"\n  "port": 1\n}');
      expect(() => load(["--config", path])).to.throw(
        /unable to read svc config at .*bad\.json: .*line 3/
      );
    });

    it("reports malformed YAML", function () {
      const path = write("bad.yaml", "host: db\n\tbad: indent\n");
      expect(() => load(["--config", path])).to.throw(
        /unable to read svc config at/
      );
    });
  });

  describe("validation", function () {
    it("rejects unknown keys with their path", function () {
      const path = write("svc.yaml", "database:\n  uri: x\n");
      expect(() => load(["--config", path])).to.throw(/database: unknown key "uri"/);
    });

    it("prefixes schema failures with the file path and key path", function () {
      const path = write("svc.yaml", "port: not-a-number\n");
      expect(() => load(["--config", path])).to.throw(
        /invalid svc config at .*svc\.yaml: port: Expected number/
      );
    });

    it("rejects unknown top-level keys", function () {
      const path = write("svc.yaml", "hots: db\n");
      expect(() => load(["--config", path])).to.throw(
        /\(root\): unknown key "hots"/
      );
    });

    it("points moved keys to their new location", function () {
      const path = write("svc.yaml", "dbUrl: postgres://x\n");
      expect(() =>
        load(["--config", path], { movedKeys: { dbUrl: "database.url" } })
      ).to.throw(/"dbUrl" moved to "database.url"/);
    });
  });

  describe("interpolation", function () {
    it("resolves ${VAR} at allowed paths", function () {
      const path = write(
        "svc.yaml",
        "database:\n  url: postgresql://${PGUSER}:${PGPASS}@db/x\n"
      );
      const cfg = load(["--config", path], {
        env: { PGUSER: "u", PGPASS: "p" },
        interpolatePaths: ["database.url"]
      });
      expect(cfg.database.url).to.equal("postgresql://u:p@db/x");
    });

    it("rejects ${VAR} outside the allowed paths", function () {
      const path = write("svc.yaml", "apiKey: ${SECRET}\n");
      expect(() =>
        load(["--config", path], {
          env: { SECRET: "s" },
          interpolatePaths: ["database.url"]
        })
      ).to.throw(/apiKey: \$\{\.\.\.\} is only allowed for values shared/);
    });

    it("rejects ${VAR} when no paths are allowed", function () {
      const path = write("svc.yaml", "apiKey: ${SECRET}\n");
      expect(() =>
        load(["--config", path], { env: { SECRET: "s" } })
      ).to.throw(/only allowed for values shared/);
    });

    it("names the variable and path when a shared value is unset", function () {
      const path = write("svc.yaml", "database:\n  url: ${UNSET_URL}\n");
      expect(() =>
        load(["--config", path], { interpolatePaths: ["database.*"] })
      ).to.throw(/database\.url: .*UNSET_URL/);
    });
  });
});
