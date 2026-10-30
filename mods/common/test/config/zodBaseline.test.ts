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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { z } from "zod";
import { fonosterConfigSchema } from "../../../apiserver/src/config/schema";
import { sessionAppInputSchema } from "../../../apiserver/src/applications/session/appModel";
import { Deepgram } from "../../../apiserver/src/voice/stt/Deepgram";
import { appBridgeConfigSchema } from "../../../appbridge/src/configSchema";
import { hostedConfigSchema } from "../../../autopilot/src/session/hosted";
import { billingConfigSchema } from "../../../billing/src/config";
import { identityServiceConfigSchema } from "../../../identity/src/server/config";
import { agentConfigSchema } from "../../../region-agent/src/config";
import { exportConfigSchemas } from "../../scripts/export-config-schemas";
import { loadServiceConfig } from "../../src/config";
import { handleError } from "../../src/errors/handleError";
import { VALID_LANGUAGE_CODE } from "../../src/messages";
import { createTrunkRequestSchema } from "../../src/validators/sipnet/trunks";

// #1219: pins the config and validation behavior a zod major upgrade could silently change:
// parsed defaults, unknown-key rejection at every nested object, the exported editor JSON
// Schemas, the API's validation error format and the custom messages with input-dependent
// text. Fixtures were captured once from the code under test (on the zod version in their
// header) with `UPDATE_ZOD_FIXTURES=1`; never edit them by hand.

const FIXTURES = path.join(__dirname, "fixtures");
const UPDATE = process.env.UPDATE_ZOD_FIXTURES === "1";
const UNKNOWN = "zzUnknownKey";

type Fixture = { capturedWith: string; value: unknown };

function fixture(name: string, actual: unknown): unknown {
  const file = path.join(FIXTURES, `${name}.json`);
  if (UPDATE) {
    fs.mkdirSync(FIXTURES, { recursive: true });
    const body: Fixture = {
      capturedWith: `zod ${require("zod/package.json").version}`,
      value: actual
    };
    fs.writeFileSync(file, JSON.stringify(body, null, 2) + "\n");
  }
  return (JSON.parse(fs.readFileSync(file, "utf8")) as Fixture).value;
}

/** As JSON (what a fixture can hold): undefined keys are dropped. */
const asJson = (value: unknown) => JSON.parse(JSON.stringify(value));

const ENCRYPTION_KEY =
  "k1.aesgcm256.QbAsmmaz84hmSaol9HreK-s91rE1Rk8YAAkTq48kZGw=";

type Service = {
  schema: z.ZodTypeAny;
  /** The fewest keys the schema requires. */
  minimal: Record<string, unknown>;
  /** Loaded through loadServiceConfig (and so strictDeep). */
  loaded: boolean;
  /** Free-form blocks (passthrough or records) and a value they accept for an extra key. */
  freeForm?: Record<string, unknown>;
};

const SERVICES: Record<string, Service> = {
  apiserver: {
    schema: fonosterConfigSchema,
    minimal: {
      domain: "fonoster.local",
      database: { url: "postgres://u:p@localhost/db" },
      encryption: { key: ENCRYPTION_KEY },
      nats: { url: "nats://localhost:4222" }
    },
    loaded: true,
    freeForm: { "evaluations.credentials": "x" }
  },
  identity: {
    schema: identityServiceConfigSchema,
    minimal: {
      database: { url: "postgres://u:p@localhost/db" },
      encryptionKey: ENCRYPTION_KEY,
      issuer: "https://fonoster.local"
    },
    loaded: true
  },
  billing: {
    schema: billingConfigSchema,
    minimal: {
      database: { url: "postgres://u:p@localhost/db" },
      nats: { url: "nats://localhost:4222" },
      rateCards: { dir: "/opt/fonoster/rate-cards" }
    },
    loaded: true,
    freeForm: { logs: "x" }
  },
  appbridge: {
    schema: appBridgeConfigSchema,
    minimal: { nats: { url: "nats://localhost:4222" }, providers: {} },
    loaded: true,
    freeForm: {
      providers: {
        adapter: "deepgram",
        capabilities: ["stt"],
        credential: { value: "k" }
      }
    }
  },
  autopilot: {
    schema: hostedConfigSchema,
    minimal: {
      signingSecret: { value: "s3cret" },
      publicUrl: "ws://autopilot:3000",
      agents: { file: "/opt/fonoster/agents.yaml" },
      registry: { file: "/opt/fonoster/registry.json" }
    },
    loaded: true,
    freeForm: { credentials: { value: "x" }, endpoints: "x" }
  },
  "region-agent": {
    schema: agentConfigSchema,
    minimal: { nats: { url: "nats://localhost:4222" } },
    loaded: false
  }
};

/** Every object path in a value (top level is []), array elements included. */
function objectPaths(value: unknown, at: (string | number)[] = []) {
  const out: (string | number)[][] = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...objectPaths(v, [...at, i])));
  } else if (value !== null && typeof value === "object") {
    out.push(at);
    for (const [k, v] of Object.entries(value))
      out.push(...objectPaths(v, [...at, k]));
  }
  return out;
}

/** The path as loadServiceConfig prints it: `a.b[0].c`. */
const printed = (p: (string | number)[]) =>
  p
    .map((s, i) => (typeof s === "number" ? `[${s}]` : i === 0 ? s : `.${s}`))
    .join("") || "(root)";

const dotted = (p: (string | number)[]) => p.join(".");

function withKey(
  value: unknown,
  at: (string | number)[],
  key: string,
  extra: unknown
): unknown {
  const copy = structuredClone(value) as Record<string | number, unknown>;
  let node: Record<string | number, unknown> = copy;
  for (const s of at)
    node = (node[s] ??= {}) as Record<string | number, unknown>;
  node[key] = extra;
  return copy;
}

describe("@common[config/zodBaseline]", function () {
  this.timeout(30_000);
  let dir: string;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "zod-baseline-"));
  });

  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  /** Loads `config` as a file through loadServiceConfig; returns the error message, if any. */
  function load(svc: string, config: unknown): string | undefined {
    const file = path.join(dir, `${svc}.json`);
    fs.writeFileSync(file, JSON.stringify(config));
    try {
      loadServiceConfig({
        service: svc,
        schema: SERVICES[svc].schema,
        argv: ["node", "svc", "--config", file],
        env: {}
      });
      return undefined;
    } catch (e) {
      return (e as Error).message.replace(`${file}: `, "");
    }
  }

  describe("defaults", function () {
    for (const [svc, { schema, minimal }] of Object.entries(SERVICES)) {
      it(`${svc}: the smallest valid config parses to the captured defaults`, function () {
        const parsed = asJson(schema.parse(minimal));
        expect(parsed).to.deep.equal(fixture(`defaults.${svc}`, parsed));
      });
    }
  });

  describe("strictness", function () {
    for (const [svc, service] of Object.entries(SERVICES)) {
      if (!service.loaded) continue;
      const freeForm = service.freeForm ?? {};
      const isFree = (p: (string | number)[]) =>
        Object.keys(freeForm).some(
          (f) => dotted(p) === f || dotted(p).startsWith(`${f}.`)
        );

      it(`${svc}: an unknown key is rejected at every nested object`, function () {
        const base = fixture(
          `defaults.${svc}`,
          asJson(service.schema.parse(service.minimal))
        );
        expect(load(svc, base), "the defaults load as a config").to.equal(
          undefined
        );
        const paths = objectPaths(base).filter((p) => !isFree(p));
        expect(paths.length).to.be.greaterThan(1);
        for (const p of paths) {
          expect(
            load(svc, withKey(base, p, UNKNOWN, "x")),
            printed(p)
          ).to.equal(
            `invalid ${svc} config at ${printed(p)}: unknown key "${UNKNOWN}"`
          );
        }
      });

      for (const [block, extra] of Object.entries(freeForm)) {
        it(`${svc}: the free-form ${block} block accepts extra keys`, function () {
          const base = fixture(
            `defaults.${svc}`,
            asJson(service.schema.parse(service.minimal))
          );
          expect(
            load(svc, withKey(base, block.split("."), UNKNOWN, extra))
          ).to.equal(undefined);
        });
      }
    }
  });

  describe("exported JSON Schemas", function () {
    it("match the captured schemas", async function () {
      const out = path.join(dir, "schemas");
      const files = await exportConfigSchemas(out);
      for (const file of files) {
        const json = JSON.parse(fs.readFileSync(file, "utf8"));
        const svc = path.basename(file, ".json");
        expect(json, svc).to.deep.equal(fixture(`jsonSchema.${svc}`, json));
      }
    });
  });

  describe("API errors", function () {
    const trunk = {
      name: "Claro",
      inboundUri: "claro.fonoster.local",
      uris: [
        {
          host: "sip.claro.example.com",
          port: 5060,
          transport: "UDP",
          weight: 10,
          priority: 1
        }
      ]
    };

    function callbackOf(schema: z.ZodTypeAny, input: unknown) {
      const result = schema.safeParse(input);
      expect(result.success).to.equal(false);
      let got: { code: number; message: string } | undefined;
      handleError(result.error as z.ZodError, (e) => (got = e));
      return got!;
    }

    it("a custom-message failure keeps its text and names the field", function () {
      const bad = {
        ...trunk,
        uris: [{ ...trunk.uris[0], transport: "BOGUS" }]
      };
      expect(callbackOf(createTrunkRequestSchema, bad)).to.deep.equal({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid transport at "uris[0].transport"'
      });
    });

    it("a built-in failure is INVALID_ARGUMENT", function () {
      const { name: _name, ...noName } = trunk;
      expect(callbackOf(createTrunkRequestSchema, noName).code).to.equal(
        status.INVALID_ARGUMENT
      );
    });
  });

  describe("custom messages with input-dependent text", function () {
    const messages = (schema: z.ZodTypeAny, input: unknown) => {
      const result = schema.safeParse(input);
      expect(result.success).to.equal(false);
      return result.error!.issues.map((i) => i.message);
    };

    it("type EXTERNAL was renamed to STREAM", function () {
      expect(
        messages(sessionAppInputSchema, { name: "app", type: "EXTERNAL" })
      ).to.include("type EXTERNAL was renamed to STREAM");
    });

    it("protocol native was renamed to fonoster", function () {
      expect(
        messages(sessionAppInputSchema, { name: "app", protocol: "native" })
      ).to.include("protocol native was renamed to fonoster");
    });

    const autopilot = SERVICES.autopilot.minimal;

    it("autopilot without publicUrl says what it is", function () {
      const { publicUrl: _p, ...rest } = autopilot;
      expect(messages(hostedConfigSchema, rest)).to.include(
        "is required: the URL Autopilot apps point to (the apiserver's apps.autopilotUrl)"
      );
    });

    it("autopilot with an http publicUrl asks for ws", function () {
      expect(
        messages(hostedConfigSchema, { ...autopilot, publicUrl: "http://x" })
      ).to.deep.equal(["must be a ws:// or wss:// URL"]);
    });

    it("autopilot with a publicUrl that is neither a URL nor a list", function () {
      expect(
        messages(hostedConfigSchema, { ...autopilot, publicUrl: 42 })
      ).to.include("must be a ws:// or wss:// URL, or a list of them");
    });

    it("an unknown language code", function () {
      expect(
        messages(Deepgram.getConfigValidationSchema(), {
          languageCode: "xx-NOPE"
        })
      ).to.include(VALID_LANGUAGE_CODE);
    });
  });
});
