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
import { createPublicKey, generateKeyPairSync } from "crypto";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { fromPublic } from "nkeys.js";
import { fonosterConfigSchema } from "../../src/config/schema";
import {
  catalogUse,
  checkPrivateRegionId,
  checkPublicRegionId,
  checkSipDomain,
  createRegionSigner,
  createRelayClient,
  decodeNatsJwt,
  endpointsHash,
  EnrollmentTokenError,
  generateRegionHub,
  isSupportedVersion,
  issueUserCreds,
  keyPairFromSeed,
  newRegionRef,
  normalizeEndpoints,
  REGION_REF,
  RegionError,
  regionDomainUri,
  regionStatus,
  regionsAccountJwt,
  requiredVersion,
  withConfigChangeHook
} from "../../src/regions";

const AGENT_HASH = "e04c56cca42b63d9";

const pem = () =>
  generateKeyPairSync("ec", { namedCurve: "P-256" })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();

describe("@apiserver[regions/units]", function () {
  describe("enrollment tokens (contract §1)", function () {
    const signer = createRegionSigner({ privateKeyPem: pem() });
    const claims = {
      iss: "https://api.example.com",
      sub: "rg_abcdefghijklmnop",
      rid: "acme-hq",
      knd: "private",
      cp: "https://api.example.com",
      leaf: "tls://leaf.example.com:7422",
      jti: "j-1"
    };

    it("signs ES256 with a kid, 24 h expiry and the contract claims", function () {
      const token = signer.sign(claims);
      const decoded = jwt.decode(token, { complete: true })!;
      expect(decoded.header.alg).to.equal("ES256");
      expect(decoded.header.kid).to.equal(signer.kid);
      const c = signer.verify(token);
      expect(c).to.include({ ...claims, aud: "fonoster.region.v1" });
      expect(c.exp - c.iat).to.equal(24 * 3600);
    });

    it("verifies with the published JWK Set", function () {
      const token = signer.sign(claims);
      const [key] = signer.jwks().keys;
      expect(key).to.include({ kid: signer.kid, alg: "ES256", kty: "EC" });
      const pub = createPublicKey({ key: key as never, format: "jwk" });
      expect(() =>
        jwt.verify(token, pub, { algorithms: ["ES256"] })
      ).not.to.throw();
    });

    it("refuses expired, foreign and wrong-audience tokens with the contract codes", function () {
      const code = (fn: () => unknown) => {
        try {
          fn();
        } catch (e) {
          return (e as EnrollmentTokenError).code;
        }
      };
      expect(code(() => signer.verify(signer.sign(claims, -10)))).to.equal(
        "token_expired"
      );
      const other = createRegionSigner({ privateKeyPem: pem() });
      expect(code(() => signer.verify(other.sign(claims)))).to.equal(
        "token_invalid"
      );
      const wrongAud = jwt.sign({ ...claims, aud: "other" }, pem(), {
        algorithm: "ES256"
      });
      expect(code(() => signer.verify(wrongAud))).to.equal("token_invalid");
    });

    it("makes rg_ refs", function () {
      const ref = newRegionRef();
      expect(ref).to.match(REGION_REF);
      expect(newRegionRef()).not.to.equal(ref);
    });
  });

  describe("NATS JWTs (RG-B2)", function () {
    const hub = generateRegionHub({});
    const account = keyPairFromSeed(hub.accountSeed);

    it("issues users allowed only region.<ref>.>, signed by the REGIONS account", function () {
      const user = issueUserCreds(account, "rg_x", {
        pub: ["region.rg_x.>"],
        sub: ["region.rg_x.>"]
      });
      const [head, body, sig] = user.jwt.split(".");
      const claims = decodeNatsJwt(user.jwt);
      expect(claims.iss).to.equal(hub.accountPublicKey);
      expect(claims.sub).to.equal(user.publicKey);
      expect(claims.nats).to.deep.include({
        type: "user",
        version: 2,
        pub: { allow: ["region.rg_x.>"] },
        sub: { allow: ["region.rg_x.>"] }
      });
      expect(claims.jti).to.match(/^[A-Z2-7]{52}$/);
      const ok = fromPublic(hub.accountPublicKey).verify(
        Buffer.from(`${head}.${body}`),
        Buffer.from(sig, "base64url")
      );
      expect(ok).to.equal(true);
      expect(user.creds)
        .to.contain("BEGIN NATS USER JWT")
        .and.contain("BEGIN USER NKEY SEED");
    });

    it("re-signs the REGIONS account with revocations", function () {
      const op = keyPairFromSeed(hub.operatorSeed);
      const claims = decodeNatsJwt(
        regionsAccountJwt(op, hub.accountPublicKey, { UABC: 123 })
      );
      expect(claims.sub).to.equal(hub.accountPublicKey);
      expect(claims.nats.revocations).to.deep.equal({ UABC: 123 });
      expect(hub.conf).to.contain("leafnodes").and.contain("resolver_preload");
    });
  });

  describe("status rules (contract §4)", function () {
    const now = new Date("2026-10-15T12:00:00Z");
    const base = {
      state: "enrolled",
      lastHeartbeatAt: new Date(now.getTime() - 30_000),
      enrolledAt: new Date(now.getTime() - 3600_000),
      version: "0.27.1",
      components: { roomrNodes: 1, gateways: 1, autopilot: true }
    };
    const st = (o: Partial<typeof base> = {}) =>
      regionStatus({ ...base, ...o } as never, {
        now,
        currentVersion: "0.27.0"
      });

    it("waiting, connected, degraded, offline and unsupported", function () {
      expect(st({ state: "waiting" }).status).to.equal("waiting");
      expect(st().status).to.equal("connected");
      expect(
        st({ components: { roomrNodes: 0, gateways: 1, autopilot: true } })
      ).to.include({
        status: "degraded"
      });
      expect(
        st({ lastHeartbeatAt: new Date(now.getTime() - 121_000) }).status
      ).to.equal("offline");
      const old = st({ version: "0.25.9" });
      expect(old).to.include({
        status: "unsupported",
        requiredVersion: "0.26.0"
      });
      expect(old.reason).to.contain("paused");
      expect(st({ version: "0.26.3" }).status).to.equal("connected");
    });

    it("an enrolled cell without a heartbeat waits 2 minutes, then is offline", function () {
      expect(
        st({
          lastHeartbeatAt: null as never,
          enrolledAt: new Date(now.getTime() - 10_000)
        }).status
      ).to.equal("waiting");
      expect(st({ lastHeartbeatAt: null as never }).status).to.equal("offline");
    });

    it("supports the current and previous minor", function () {
      expect(requiredVersion("1.4.2")).to.equal("1.3.0");
      expect(isSupportedVersion("1.3.0", "1.4.2")).to.equal(true);
      expect(isSupportedVersion("1.2.9", "1.4.2")).to.equal(false);
      expect(isSupportedVersion("2.0.0", "1.4.2")).to.equal(true);
      expect(isSupportedVersion("nonsense", "1.4.2")).to.equal(false);
    });
  });

  describe("endpoints (contract §3, §3a)", function () {
    const e = {
      sip: [
        { host: "sip.acme.example", port: 5061, transport: "TLS" },
        { host: "sip.acme.example", port: 5060, transport: "udp" },
        { host: "x", port: 5060, transport: "sctp" },
        { host: "", port: 5060 }
      ],
      signalingAddresses: ["203.0.113.10", "203.0.113.10", "a b"],
      mediaAddresses: ["203.0.113.11"],
      rtpPorts: { min: 30000, max: 20000 }
    };

    it("keeps valid SIP entries and addresses, drops the rest", function () {
      const n = normalizeEndpoints(e)!;
      expect(n.sip).to.deep.equal([
        { host: "sip.acme.example", port: 5061, transport: "tls" },
        { host: "sip.acme.example", port: 5060, transport: "udp" }
      ]);
      expect(n.signalingAddresses).to.deep.equal(["203.0.113.10"]);
      expect(n.rtpPorts).to.equal(undefined);
      expect(normalizeEndpoints({ sip: [] })).to.equal(undefined);
      expect(normalizeEndpoints("nope")).to.equal(undefined);
    });

    it("hashes like the region agent: updatedAt does not matter", function () {
      const a = normalizeEndpoints(e)!;
      const b = { ...a, updatedAt: new Date().toISOString() };
      expect(endpointsHash(a)).to.match(/^[0-9a-f]{16}$/);
      expect(endpointsHash(a)).to.equal(endpointsHash(b));
      // Same value as mods/region-agent's endpointsHash for this input.
      expect(
        endpointsHash({
          sip: [{ host: "203.0.113.10", port: 5060, transport: "udp" }],
          signalingAddresses: ["203.0.113.10"],
          mediaAddresses: ["203.0.113.10"],
          rtpPorts: { min: 10000, max: 20000 }
        })
      ).to.equal(AGENT_HASH);
      expect(
        endpointsHash({ ...a, mediaAddresses: ["203.0.113.12"] })
      ).to.not.equal(endpointsHash(a));
    });

    it("accepts configured endpoints for public regions", function () {
      const regions = fonosterConfigSchema.innerType().shape.regions.parse({
        public: [
          {
            id: "default",
            name: "US East",
            default: true,
            endpoints: {
              sip: [{ host: "203.0.113.5", port: 5060, transport: "udp" }],
              signalingAddresses: ["203.0.113.5"],
              rtpPorts: { min: 10000, max: 20000 }
            }
          }
        ]
      });
      expect(regions.public[0].endpoints).to.deep.equal({
        sip: [{ host: "203.0.113.5", port: 5060, transport: "udp" }],
        signalingAddresses: ["203.0.113.5"],
        mediaAddresses: [],
        rtpPorts: { min: 10000, max: 20000 }
      });
    });
  });

  describe("region ids and SIP domains (PR-16, PR-18)", function () {
    const code = (fn: () => unknown) => {
      try {
        fn();
        return "ok";
      } catch (e) {
        return (e as RegionError).code;
      }
    };

    it("accepts private ids of 3-32 lowercase letters, digits and hyphens starting with a letter", function () {
      expect(checkPrivateRegionId("acme-hq")).to.equal("acme-hq");
      expect(code(() => checkPrivateRegionId("abc"))).to.equal("ok");
      expect(code(() => checkPrivateRegionId("a".repeat(32)))).to.equal("ok");
      for (const bad of [
        "ab",
        "a".repeat(33),
        "1acme",
        "Acme",
        "acme_hq",
        "",
        7
      ])
        expect(code(() => checkPrivateRegionId(bad))).to.equal(
          "region_id_invalid"
        );
    });

    it("reserves default, the public geo prefixes and route words for private ids", function () {
      for (const id of [
        "default",
        "us-acme",
        "eu-west-1",
        "sa-x1",
        "ap-tokyo",
        "af-x1",
        "me-x1",
        "current",
        "enroll",
        "admin"
      ])
        expect(code(() => checkPrivateRegionId(id))).to.equal(
          "region_id_reserved"
        );
      expect(code(() => checkPrivateRegionId("usa-hq"))).to.equal("ok");
    });

    it("public ids are default or <geo>-<area>-<n>", function () {
      expect(checkPublicRegionId("default")).to.equal("default");
      expect(checkPublicRegionId("us-east-1")).to.equal("us-east-1");
      for (const bad of ["acme-hq", "us-east", "xx-east-1"])
        expect(code(() => checkPublicRegionId(bad))).to.equal(
          "region_id_invalid"
        );
    });

    it("requires a lowercase FQDN as SIP domain", function () {
      expect(checkSipDomain("SIP.Acme.com.")).to.equal("sip.acme.com");
      for (const bad of [
        "",
        "localhost",
        "*.sip.acme.com",
        "-sip.acme.com",
        "sip.acme.123",
        "sip..acme.com",
        `${"a".repeat(64)}.com`,
        undefined
      ])
        expect(code(() => checkSipDomain(bad))).to.equal("sip_domain_invalid");
      expect(checkSipDomain(undefined, true)).to.equal(undefined);
    });

    it("rewrites cloud domains under the region's SIP domain", function () {
      expect(
        regionDomainUri(
          "acme.fonoster.example",
          "fonoster.example",
          "sip.acme.com"
        )
      ).to.equal("acme.sip.acme.com");
      expect(
        regionDomainUri(
          "ops.acme.sip.acme.com",
          "fonoster.example",
          "sip.acme.com"
        )
      ).to.equal("ops.acme.sip.acme.com");
      expect(
        regionDomainUri("x.other.net", "fonoster.example", "sip.acme.com")
      ).to.equal("x.sip.acme.com");
      expect(
        regionDomainUri("acme.fonoster.example", "fonoster.example", null)
      ).to.equal("acme.fonoster.example");
    });
  });

  describe("config (PR-17, PR-19)", function () {
    it("defaults to one public region with the id default and refuses another default id", function () {
      const regions = fonosterConfigSchema.innerType().shape.regions.parse({});
      expect(regions.public).to.deep.equal([
        { id: "default", name: "Default", default: true }
      ]);
      const base = {
        domain: "example.com",
        database: { url: "postgres://x" },
        encryption: { key: "k".repeat(32) },
        nats: { url: "nats://x" },
        influxdb: {
          url: "u",
          org: "o",
          username: "u",
          password: "p",
          token: "t"
        },
        identity: {}
      };
      const bad = fonosterConfigSchema.safeParse({
        ...base,
        regions: { public: [{ id: "us-east-1", name: "US", default: true }] }
      });
      expect(bad.success).to.equal(false);
      expect(JSON.stringify(bad.error?.issues)).to.contain(
        "the default public region's id must be `default`"
      );
    });
  });

  describe("secrets needed (PR-4)", function () {
    it("derives provider names from apps, defaults and assistants", function () {
      const { ids, secrets } = catalogUse(
        [
          {
            ref: "a1",
            name: "Sales",
            speechVoice: "elevenlabs/rachel",
            speechSttModel: ""
          },
          { ref: "a2", name: "Ada" }
        ],
        [
          {
            appRef: "a2",
            productRef: "llm.groq",
            config: { languageModel: { model: "groq/openai/gpt-oss-20b" } }
          }
        ]
      );
      expect(ids)
        .to.include("elevenlabs/rachel")
        .and.include("deepgram/nova-3");
      expect(secrets).to.deep.equal([
        { name: "deepgram", usedBy: ["Ada", "Sales"] },
        { name: "elevenlabs", usedBy: ["Sales"] },
        { name: "groq", usedBy: ["Ada"] }
      ]);
    });
  });

  describe("config change hook", function () {
    it("reports successful writes of synced services only", async function () {
      const changed: string[] = [];
      const ok = (_c: unknown, cb: (e: unknown, r?: unknown) => void) =>
        cb(null, { ref: "x" });
      const fail = (_c: unknown, cb: (e: unknown) => void) => cb({ code: 3 });
      const [apps, users] = withConfigChangeHook(
        [
          {
            definition: { serviceName: "Applications" },
            handlers: {
              createApplication: ok,
              updateApplication: fail,
              listApplications: ok
            }
          },
          {
            definition: { serviceName: "Identity" },
            handlers: { createWorkspace: ok }
          }
        ] as never[],
        (id) => changed.push(id)
      ) as {
        handlers: Record<
          string,
          (c: unknown, cb: (...a: unknown[]) => void) => void
        >;
      }[];
      const metadata = new grpc.Metadata();
      metadata.set("accessKeyId", "WOacme");
      const results: unknown[] = [];
      apps.handlers.createApplication({ metadata }, (e, r) =>
        results.push([e, r])
      );
      apps.handlers.updateApplication({ metadata }, (e) => results.push(e));
      apps.handlers.listApplications({ metadata }, () => undefined);
      users.handlers.createWorkspace({ metadata }, () => undefined);
      expect(results[0]).to.deep.equal([null, { ref: "x" }]);
      expect(changed).to.deep.equal(["WOacme"]);
    });
  });

  describe("relay limits", function () {
    it("answers rate_limited beyond the concurrent relays of a region, and frees slots", async function () {
      const nc = {
        subscribe: () => ({
          unsubscribe() {},
          async *[Symbol.asyncIterator]() {
            await new Promise(() => undefined);
          }
        }),
        publish() {}
      };
      const relay = createRelayClient(nc as never, {
        firstChunkTimeoutMs: 100,
        maxConcurrent: 1
      });
      const req = {
        userRef: "u",
        workspaceRef: "WOacme",
        op: "record.get" as const,
        callRef: "c"
      };
      const first = relay.open("rg_aaaaaaaaaaaaaaaa", req).catch((e) => e.code);
      const second = await relay
        .open("rg_aaaaaaaaaaaaaaaa", req)
        .catch((e) => e.code);
      expect(second).to.equal("rate_limited");
      expect(await first).to.equal("region_offline");
      expect(
        await relay.open("rg_aaaaaaaaaaaaaaaa", req).catch((e) => e.code)
      ).to.equal("region_offline");
    });
  });
});
