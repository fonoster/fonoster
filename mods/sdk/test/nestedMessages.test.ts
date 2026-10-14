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
import { jsonToObject } from "../src/client/jsonToObject";
import { objectToJson } from "../src/client/objectToJson";
import {
  CreateDomainRequest,
  Domain,
  EgressPolicy
} from "../src/generated/node/domains_pb";
import { Acl } from "../src/generated/node/acls_pb";

describe("@sdk[client/nested messages]", function () {
  it("sends repeated objects (a domain's egress policies)", function () {
    const request = jsonToObject({
      json: {
        name: "HQ",
        domainUri: "hq.acme.sip.fonoster.io",
        egressPolicies: [{ rule: ".*", numberRef: "nb-1" }]
      },
      objectConstructor: CreateDomainRequest,
      objectMapping: [["egressPolicies", EgressPolicy]]
    });

    const policies = request.getEgressPoliciesList();
    expect(policies).to.have.length(1);
    expect(policies[0].getRule()).to.equal(".*");
    expect(policies[0].getNumberRef()).to.equal("nb-1");
  });

  it("returns nested messages as plain objects with SDK field names", function () {
    const acl = new Acl();
    acl.setRef("acl-1");
    acl.setName("Office");
    acl.setAllowList(["10.0.0.0/16"]);
    const policy = new EgressPolicy();
    policy.setRule("^\\+34");
    policy.setNumberRef("nb-2");
    const domain = new Domain();
    domain.setRef("dm-1");
    domain.setName("HQ");
    domain.setAccessControlList(acl);
    domain.setEgressPoliciesList([policy]);

    const json = objectToJson<Record<string, unknown>>(
      domain as unknown as new () => unknown
    );

    expect(json.accessControlList).to.deep.include({
      ref: "acl-1",
      name: "Office",
      allow: ["10.0.0.0/16"]
    });
    expect(json.egressPolicies).to.deep.equal([
      { rule: "^\\+34", numberRef: "nb-2" }
    ]);
  });
});
