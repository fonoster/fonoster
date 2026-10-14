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
});
