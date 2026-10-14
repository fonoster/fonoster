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
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expect } from "chai";
import { z } from "zod";
import { findLegacyEnv, getIntegrationsFromFile, strictDeep } from "../../src";

describe("@common[config/strictDeep]", function () {
  it("rejects unknown keys through defaults, optionals and arrays", function () {
    const schema = strictDeep(
      z.object({
        smtp: z.object({ host: z.string() }).optional(),
        logs: z.object({ level: z.string().default("info") }).default({}),
        hosts: z.array(z.object({ name: z.string() })).default([])
      })
    );

    expect(schema.safeParse({ smtp: { host: "a", hsot: "b" } }).success).to.be
      .false;
    expect(schema.safeParse({ logs: { levle: "x" } }).success).to.be.false;
    expect(schema.safeParse({ hosts: [{ name: "a", extra: 1 }] }).success).to
      .be.false;
    expect(schema.safeParse({ logs: {} }).success).to.be.true;
  });

  it("keeps refinements working", function () {
    const schema = strictDeep(
      z
        .object({ enabled: z.boolean(), host: z.string().optional() })
        .superRefine((value, ctx) => {
          if (value.enabled && !value.host) {
            ctx.addIssue({ code: "custom", message: "host required" });
          }
        })
    );

    expect(schema.safeParse({ enabled: true }).success).to.be.false;
    expect(schema.safeParse({ enabled: true, host: "a", x: 1 }).success).to.be
      .false;
    expect(schema.safeParse({ enabled: true, host: "a" }).success).to.be.true;
  });

  it("leaves passthrough objects free-form", function () {
    const schema = strictDeep(
      z.object({ credentials: z.object({}).passthrough() })
    );

    expect(schema.safeParse({ credentials: { apiKey: "x", any: 1 } }).success)
      .to.be.true;
  });
});

describe("@common[config/findLegacyEnv]", function () {
  it("returns only matching names, sorted, never values", function () {
    const names = findLegacyEnv(["APISERVER_", "AUTOPILOT_"], {
      AUTOPILOT_LOGS_LEVEL: "info",
      APISERVER_SMTP_HOST: "smtp",
      POSTGRES_PASSWORD: "secret"
    });

    expect(names).to.deep.equal(["APISERVER_SMTP_HOST", "AUTOPILOT_LOGS_LEVEL"]);
  });
});

describe("@common[config/getIntegrationsFromFile]", function () {
  let dir: string;

  beforeEach(function () {
    dir = mkdtempSync(join(tmpdir(), "fonoster-int-"));
  });

  afterEach(function () {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reads YAML and JSON alike", function () {
    const yaml = join(dir, "integrations.yaml");
    const json = join(dir, "integrations.json");
    writeFileSync(
      yaml,
      "- name: Deepgram STT\n  productRef: stt.deepgram\n  type: stt\n  credentials:\n    apiKey: k\n"
    );
    writeFileSync(
      json,
      '[{"name":"Deepgram STT","productRef":"stt.deepgram","type":"stt","credentials":{"apiKey":"k"}}]'
    );

    expect(getIntegrationsFromFile(yaml)).to.deep.equal(
      getIntegrationsFromFile(json)
    );
  });

  it("throws with the file path instead of exiting", function () {
    const path = join(dir, "integrations.yaml");
    writeFileSync(path, "- name: x\n  type: video\n");

    expect(() => getIntegrationsFromFile(path)).to.throw(
      /invalid integrations at .*integrations\.yaml/
    );
  });
});
