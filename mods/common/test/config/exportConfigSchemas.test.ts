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
import * as os from "os";
import * as path from "path";
import Ajv2020 from "ajv/dist/2020";
import { expect } from "chai";
import { parse } from "yaml";
import { z } from "zod";
import { fonosterConfigSchema } from "../../../apiserver/src/config/schema";
import { hostedConfigSchema } from "../../../autopilot/src/session/hosted";
import { gatewayConfigSchema } from "../../../gateway/src/configSchema";
import { identityServiceConfigSchema } from "../../../identity/src/server/config";
import { exportConfigSchemas } from "../../scripts/export-config-schemas";
import { strictDeep, toJsonSchema } from "../../src/config";

// add-self-host-installer 4.1: the exported JSON Schemas accept the shipped and rendered example
// configs and reject unknown keys, in agreement with the services' own (strict) Zod validation.

const ROOT = path.join(__dirname, "../../../..");
const yamlFile = (rel: string) =>
  parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));

const IDENTITY = {
  database: { url: "postgresql://postgres:postgres@postgres:5432/fnidentity" },
  encryptionKey: "k1.aesgcm256.QbAsmmaz84hmSaol9HreK-s91rE1Rk8YAAkTq48kZGw=",
  issuer: "https://fonoster.local",
  keys: {
    privateKeyPath: "/opt/fonoster/keys/private.pem",
    publicKeyPath: "/opt/fonoster/keys/public.pem"
  },
  defaultUser: { email: "admin@fonoster.local", password: "changeme" }
};

/** Example configs per service (as files carry them, before defaults). */
const EXAMPLES: Record<string, { schema: z.ZodTypeAny; configs: unknown[] }> = {
  apiserver: {
    schema: fonosterConfigSchema,
    configs: [yamlFile("config/fonoster.example.yaml")]
  },
  identity: { schema: identityServiceConfigSchema, configs: [IDENTITY] },
  gateway: {
    schema: gatewayConfigSchema,
    configs: [yamlFile("ops/rebuild/config/gateway.yaml")]
  },
  autopilot: {
    schema: hostedConfigSchema,
    configs: [
      yamlFile("config/autopilot-session.example.yaml"),
      yamlFile("ops/rebuild/config/autopilot-session.yaml")
    ]
  }
};

describe("@common[config/exportConfigSchemas]", function () {
  this.timeout(30_000);
  let dir: string;
  const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
    // What `check` will do too (no ajv-formats): formats are documentation only.
    formats: { uri: true, email: true }
  });
  const validator = (svc: string) =>
    ajv.getSchema(`https://fonoster.com/schemas/config/${svc}.json`) ??
    ajv.compile(
      JSON.parse(fs.readFileSync(path.join(dir, `${svc}.json`), "utf8"))
    );

  before(async function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "config-schemas-"));
    const files = await exportConfigSchemas(dir);
    expect(files.map((f) => path.basename(f))).to.deep.equal([
      "apiserver.json",
      "identity.json",
      "gateway.json",
      "autopilot.json"
    ]);
  });

  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  for (const [svc, { schema, configs }] of Object.entries(EXAMPLES)) {
    it(`${svc}: the example configs validate`, function () {
      const validate = validator(svc);
      for (const config of configs) {
        const ok = validate(config);
        expect(ok, JSON.stringify(validate.errors)).to.equal(true);
        // The service's own validation agrees (structure; cross-field rules aside).
        expect(strictDeep(schema).safeParse(config).success).to.equal(true);
      }
    });

    it(`${svc}: an unknown key is rejected`, function () {
      const validate = validator(svc);
      const typo = { ...(configs[0] as object), databse: { url: "x" } };
      expect(validate(typo)).to.equal(false);
      expect(validate.errors?.[0]).to.include({
        keyword: "additionalProperties"
      });
      expect(validate.errors?.[0].params).to.deep.equal({
        additionalProperty: "databse"
      });
    });
  }

  it("rejects unknown keys in nested objects", function () {
    const validate = validator("apiserver");
    const config = yamlFile("config/fonoster.example.yaml");
    config.catalog = { file: "/opt/fonoster/catalog.yaml", fiel: "typo" };
    expect(validate(config)).to.equal(false);
    expect(validate.errors?.[0].instancePath).to.equal("/catalog");
  });

  it("keeps passthrough blocks open and records free-form", function () {
    const json = toJsonSchema(
      z.object({
        free: z.object({ a: z.string() }).passthrough(),
        map: z.record(z.number()),
        n: z.number().int().positive().default(3),
        e: z.enum(["x", "y"]).optional()
      })
    ) as {
      required?: string[];
      additionalProperties: boolean;
      properties: Record<string, Record<string, unknown>>;
    };
    expect(json.additionalProperties).to.equal(false);
    expect(json.required).to.deep.equal(["free", "map"]);
    expect(json.properties.free.additionalProperties).to.equal(true);
    expect(json.properties.map.additionalProperties).to.deep.equal({
      type: "number"
    });
    expect(json.properties.n).to.deep.equal({
      type: "integer",
      exclusiveMinimum: 0,
      default: 3
    });
  });

  it("refuses Zod types it can't represent", function () {
    expect(() => toJsonSchema(z.object({ d: z.date() }))).to.throw(
      /unsupported Zod type ZodDate at d/
    );
  });
});
