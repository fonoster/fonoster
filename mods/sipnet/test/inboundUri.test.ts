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
import {
  isInboundUriAllowed,
  withInboundUriCheck
} from "../src/trunks/inboundUri";

describe("@sipnet[trunks/inboundUri]", function () {
  const root = "sip.acme.com";

  it("accepts one label under the root", function () {
    expect(isInboundUriAllowed("claro.sip.acme.com", root)).to.equal(true);
    expect(isInboundUriAllowed("claro-rd.sip.acme.com", root)).to.equal(true);
  });

  it("rejects other hosts, nested labels and bad labels", function () {
    expect(isInboundUriAllowed("claro.com", root)).to.equal(false);
    expect(isInboundUriAllowed("a.claro.sip.acme.com", root)).to.equal(false);
    expect(isInboundUriAllowed("sip.acme.com", root)).to.equal(false);
    expect(isInboundUriAllowed("-claro.sip.acme.com", root)).to.equal(false);
    expect(isInboundUriAllowed("Claro.sip.acme.com", root)).to.equal(false);
  });

  it("accepts any host without a root", function () {
    expect(isInboundUriAllowed("claro.com")).to.equal(true);
    expect(isInboundUriAllowed("10.0.0.5")).to.equal(true);
  });

  it("answers INVALID_ARGUMENT before the handler runs", async function () {
    let ran = false;
    let error: { code?: number } | undefined;
    const handler = withInboundUriCheck(async () => {
      ran = true;
    }, root);
    await handler({ request: { inboundUri: "claro.com" } }, (e) => {
      error = e as never;
    });
    expect(ran).to.equal(false);
    expect(error?.code).to.equal(3);
  });

  it("lets an update that leaves the URI blank through", async function () {
    let ran = false;
    const handler = withInboundUriCheck(async () => {
      ran = true;
    }, root);
    await handler({ request: { inboundUri: "" } }, () => undefined);
    expect(ran).to.equal(true);
  });
});
