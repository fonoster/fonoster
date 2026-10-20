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
import { expect } from "chai";
import { isSipNameAllowed, withSipNameCheck } from "../src/resources/sipNames";

describe("@sipnet[resources/sipNames]", function () {
  const root = "pstn.example.com";

  it("accepts one label under the root", function () {
    expect(isSipNameAllowed("acme.pstn.example.com", root)).to.equal(true);
    expect(isSipNameAllowed("acme-rd.pstn.example.com", root)).to.equal(true);
  });

  it("rejects other hosts, nested labels and bad labels", function () {
    expect(isSipNameAllowed("acme.com", root)).to.equal(false);
    expect(isSipNameAllowed("a.acme.pstn.example.com", root)).to.equal(false);
    expect(isSipNameAllowed("pstn.example.com", root)).to.equal(false);
    expect(isSipNameAllowed("-acme.pstn.example.com", root)).to.equal(false);
    expect(isSipNameAllowed("Acme.pstn.example.com", root)).to.equal(false);
  });

  it("accepts any host without a root", function () {
    expect(isSipNameAllowed("acme.com")).to.equal(true);
    expect(isSipNameAllowed("10.0.0.5")).to.equal(true);
  });

  it("answers INVALID_ARGUMENT before the handler runs", async function () {
    let ran = false;
    let error: { code?: number } | undefined;
    const handler = withSipNameCheck(
      async (_call: { request: { inboundUri?: string } }) => {
        ran = true;
      },
      "inboundUri",
      "inbound URI",
      root
    );
    await handler({ request: { inboundUri: "acme.com" } }, (e) => {
      error = e as never;
    });
    expect(ran).to.equal(false);
    expect(error?.code).to.equal(3);
  });

  it("lets an update that leaves the URI blank through", async function () {
    let ran = false;
    const handler = withSipNameCheck(
      async (_call: { request: { inboundUri?: string } }) => {
        ran = true;
      },
      "inboundUri",
      "inbound URI",
      root
    );
    await handler({ request: { inboundUri: "" } }, () => undefined);
    expect(ran).to.equal(true);
  });

  it("checks a domain's domainUri the same way", async function () {
    let error: { code?: number; message?: string } | undefined;
    const handler = withSipNameCheck(
      async (_call: { request: { domainUri?: string } }) => undefined,
      "domainUri",
      "domain",
      "sip.example.com"
    );
    await handler({ request: { domainUri: "acme.example.com" } }, (e) => {
      error = e as never;
    });
    expect(error?.code).to.equal(3);
    expect(error?.message).to.include("The domain must be one label under");
  });
});
