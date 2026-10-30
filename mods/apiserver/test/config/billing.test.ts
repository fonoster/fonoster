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
import { fonosterConfigSchema } from "../../src/config/schema";

// Billing in fonoster.yaml (#1235): the Billing API is one switch with a stated address; it no
// longer needs authz, which asks before CreateCall and stays for a custom authorization service.

const fixture = join(__dirname, "..", "fixtures", "fonoster.test.yaml");
const base = parseConfigFile(fixture, readFileSync(fixture, "utf8")) as Record<
  string,
  unknown
>;
const parse = (extra: Record<string, unknown>) =>
  fonosterConfigSchema.safeParse({ ...base, ...extra });

describe("@apiserver[config/billing]", function () {
  it("turns billing on without authz, at the stated address", function () {
    const parsed = parse({
      features: { billing: { enabled: true, address: "billing:50073" } }
    });
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).to.equal(true);
    expect(parsed.data!.features.billing).to.deep.equal({
      enabled: true,
      address: "billing:50073"
    });
    // authz off: no CheckMethodAuthorized before CreateCall.
    expect(parsed.data!.authz.enabled).to.equal(false);
  });

  it("refuses billing on without an address, naming features.billing.address", function () {
    const parsed = parse({ features: { billing: { enabled: true } } });
    expect(parsed.success).to.equal(false);
    expect(
      parsed.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    ).to.deep.equal([
      "features.billing.address: required when features.billing.enabled is true"
    ]);
  });

  it("still loads a config that also sets authz", function () {
    const parsed = parse({
      authz: { enabled: true, host: "billing" },
      features: { billing: { enabled: true, address: "billing:50073" } }
    });
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).to.equal(true);
    expect(parsed.data!.authz).to.include({ enabled: true, host: "billing" });
  });
});
