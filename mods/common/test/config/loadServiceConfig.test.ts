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
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import { z } from "zod";
import { loadServiceConfig } from "../../src";

const schema = z.object({
  host: z.string().default("localhost"),
  port: z.number().default(5432),
  apiKey: z.string().optional()
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

  it("loads and validates a file given via --config", function () {
    const path = write("svc.yaml", "host: db\nport: 6000\n");
    const cfg = loadServiceConfig({
      service: "svc",
      schema,
      argv: ["node", "svc", "--config", path],
      env: {}
    });
    expect(cfg).to.deep.equal({ host: "db", port: 6000 });
  });

  it("honours FONOSTER_CONFIG and applies schema defaults", function () {
    const path = write("svc.yaml", "host: db\n");
    const cfg = loadServiceConfig({
      service: "svc",
      schema,
      argv: ["node", "svc"],
      env: { FONOSTER_CONFIG: path }
    });
    expect(cfg).to.deep.equal({ host: "db", port: 5432 });
  });

  it("lets --config win over FONOSTER_CONFIG", function () {
    const flagPath = write("flag.yaml", "host: from-flag\n");
    const envPath = write("env.yaml", "host: from-env\n");
    const cfg = loadServiceConfig({
      service: "svc",
      schema,
      argv: ["node", "svc", "--config", flagPath],
      env: { FONOSTER_CONFIG: envPath }
    });
    expect(cfg.host).to.equal("from-flag");
  });

  it("interpolates ${VAR} secrets before validating", function () {
    const path = write("svc.yaml", "host: db\napiKey: ${MY_SECRET}\n");
    const cfg = loadServiceConfig({
      service: "svc",
      schema,
      argv: ["node", "svc", "--config", path],
      env: { MY_SECRET: "s3cr3t" }
    });
    expect(cfg.apiKey).to.equal("s3cr3t");
  });

  it("falls back to defaults when the default file is absent", function () {
    const cfg = loadServiceConfig({
      service: "does-not-exist-anywhere",
      schema,
      argv: ["node", "svc"],
      env: {}
    });
    expect(cfg).to.deep.equal({ host: "localhost", port: 5432 });
  });

  it("throws when an explicitly requested file is missing", function () {
    expect(() =>
      loadServiceConfig({
        service: "svc",
        schema,
        argv: ["node", "svc", "--config", join(dir, "nope.yaml")],
        env: {}
      })
    ).to.throw(/unable to read svc config at .*nope\.yaml/);
  });

  it("throws a readable error on malformed YAML", function () {
    const path = write("bad.yaml", "host: db\n\tbad: indent\n");
    expect(() =>
      loadServiceConfig({
        service: "svc",
        schema,
        argv: ["node", "svc", "--config", path],
        env: {}
      })
    ).to.throw(/unable to read svc config at/);
  });

  it("throws with an 'invalid <service> config' prefix on schema failure", function () {
    const path = write("svc.yaml", "port: not-a-number\n");
    expect(() =>
      loadServiceConfig({
        service: "svc",
        schema,
        argv: ["node", "svc", "--config", path],
        env: {}
      })
    ).to.throw(/invalid svc config at/);
  });

  it("throws for an undefined secret with no default", function () {
    const path = write("svc.yaml", "host: db\napiKey: ${UNSET_SECRET}\n");
    expect(() =>
      loadServiceConfig({
        service: "svc",
        schema,
        argv: ["node", "svc", "--config", path],
        env: {}
      })
    ).to.throw(/invalid svc config at .*UNSET_SECRET/);
  });
});
