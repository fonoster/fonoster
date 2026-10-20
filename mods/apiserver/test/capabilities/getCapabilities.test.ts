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
import { createGetCapabilities } from "../../src/capabilities";
import { FonosterConfig, fonosterConfigSchema } from "../../src/config";

const fixture = join(__dirname, "..", "fixtures", "fonoster.test.yaml");

/** The test fixture with some fields replaced, validated like fonoster.yaml. */
function configWith(overrides: Record<string, unknown>): FonosterConfig {
  const raw = parseConfigFile(fixture, readFileSync(fixture, "utf8")) as Record<
    string,
    unknown
  >;
  return fonosterConfigSchema.parse({ ...raw, ...overrides }) as FonosterConfig;
}

function getCapabilities(config: FonosterConfig) {
  return new Promise<Record<string, unknown>>((resolve) =>
    createGetCapabilities(config)({}, (_error, response) => resolve(response))
  );
}

describe("@apiserver[capabilities/getCapabilities]", function () {
  it("reports how trunk inbound URIs are checked", async function () {
    const strict = await getCapabilities(configWith({}));
    expect(strict.trunks).to.deep.equal({ inboundUri: "domain" });

    const raw = configWith({});
    const open = await getCapabilities(
      configWith({
        features: { ...raw.features, trunks: { inboundUri: "any" } }
      })
    );
    expect(open.trunks).to.deep.equal({ inboundUri: "any" });
  });

  it("reports Community defaults from fonoster.yaml", async function () {
    const response = await getCapabilities(configWith({}));

    expect(response.auth).to.deep.equal({
      methods: ["password"],
      signup: "invite",
      github: undefined
    });
    expect(response.billing).to.deep.equal({ enabled: false });
    expect(response.domain).to.be.a("string").and.not.be.empty;
    expect(response.appUrl).to.match(/^https?:\/\//);
  });

  it("exposes the GitHub client id but never the secret", async function () {
    const raw = configWith({});
    const config = configWith({
      features: {
        ...raw.features,
        auth: { methods: ["github", "email_code"], signup: "open" }
      },
      identity: {
        ...parseConfigFile(fixture, readFileSync(fixture, "utf8")).identity,
        oauth2: { github: { clientId: "gh-id", clientSecret: "gh-secret" } }
      },
      twilio: undefined
    });

    const response = await getCapabilities(config);

    expect(JSON.stringify(response)).not.to.include("gh-secret");
    expect(response.auth).to.deep.equal({
      methods: ["github", "email_code"],
      signup: "open",
      github: {
        clientId: "gh-id",
        authorizeUrl: "https://github.com/login/oauth/authorize"
      }
    });
  });

  it("points the authorize URL at a configured GitHub (a fake one in tests)", async function () {
    const raw = configWith({});
    const config = configWith({
      features: {
        ...raw.features,
        auth: { methods: ["github"], signup: "invite" }
      },
      identity: {
        ...parseConfigFile(fixture, readFileSync(fixture, "utf8")).identity,
        oauth2: {
          github: {
            clientId: "gh-id",
            clientSecret: "gh-secret",
            url: "http://localhost:3999/"
          }
        }
      },
      twilio: undefined
    });

    const response = await getCapabilities(config);

    expect(response.auth).to.have.nested.property(
      "github.authorizeUrl",
      "http://localhost:3999/login/oauth/authorize"
    );
  });

  describe("regions.private", function () {
    const hub = {
      url: "tls://hub.internal.example:4222",
      credentialsFile: "/etc/fonoster/hub.creds",
      systemCredentialsFile: "/etc/fonoster/sys.creds",
      operatorSeedFile: "/etc/fonoster/operator.nk",
      accountSeedFile: "/etc/fonoster/account.nk"
    };
    const signingKey = { file: "/etc/fonoster/region-signing.pem" };

    it("is false without hub settings (the default public region does not count)", async function () {
      const response = await getCapabilities(configWith({}));

      expect(response.regions).to.deep.equal({ private: false });
    });

    it("is false with only the signing key or only the hub", async function () {
      const keyOnly = await getCapabilities(
        configWith({ regions: { signingKey } })
      );
      const hubOnly = await getCapabilities(configWith({ regions: { hub } }));

      expect(keyOnly.regions).to.deep.equal({ private: false });
      expect(hubOnly.regions).to.deep.equal({ private: false });
    });

    it("is true with the hub and signing key, without exposing them", async function () {
      const response = await getCapabilities(
        configWith({
          regions: {
            signingKey,
            hub,
            leafUrl: "tls://leaf.internal.example:7422",
            controlPlaneUrl: "https://cp.internal.example"
          }
        })
      );

      expect(response.regions).to.deep.equal({ private: true });
      const json = JSON.stringify(response);
      for (const leak of [
        "hub.internal",
        "leaf.internal",
        "cp.internal",
        ".creds",
        ".pem",
        ".nk"
      ]) {
        expect(json).not.to.include(leak);
      }
    });
  });
  describe("connection", function () {
    it("reports the default public region's SIP, allowlist and RTP details, with no private regions", async function () {
      const response = await getCapabilities(
        configWith({
          regions: {
            public: [
              { id: "other", name: "Other" },
              {
                id: "default",
                name: "Local",
                default: true,
                endpoints: {
                  sip: [
                    { host: "192.0.2.10", port: "5060", transport: "udp" },
                    { host: "192.0.2.10", port: 5060, transport: "tcp" }
                  ],
                  signalingAddresses: ["192.0.2.10"],
                  mediaAddresses: ["192.0.2.10"],
                  rtpPorts: { min: "10000", max: 10999 }
                }
              }
            ]
          }
        })
      );

      expect(response.regions).to.deep.equal({ private: false });
      expect(response.connection).to.deep.equal({
        sip: [
          { host: "192.0.2.10", port: 5060, transport: "udp" },
          { host: "192.0.2.10", port: 5060, transport: "tcp" }
        ],
        signalingAddresses: ["192.0.2.10"],
        mediaAddresses: ["192.0.2.10"],
        rtpPorts: { min: 10000, max: 10999 }
      });
    });

    it("is empty when the region lists no endpoints", async function () {
      const response = await getCapabilities(configWith({}));

      expect(response.connection).to.deep.equal({
        sip: [],
        signalingAddresses: [],
        mediaAddresses: [],
        rtpPorts: undefined
      });
    });
  });
});
