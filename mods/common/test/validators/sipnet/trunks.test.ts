/*
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
import { Transport } from "@fonoster/types";
import { expect } from "chai";
import { createTrunkRequestSchema } from "../../../src";

describe("@apiserver[common/validators/sipnet/trunks]", function () {
  it("checks the zero values dropped by proto3 are restored", async function () {
    // Arrange
    // A request as it reaches the handler after the wire dropped every scalar
    // the client set to its zero value: sendRegister, weight, priority, enabled
    const createTrunkRequest = {
      name: "My Trunk",
      inboundUri: "sip.fonoster.io",
      uris: [
        {
          host: "sip.provider.net",
          port: 5060,
          transport: Transport.TCP
        }
      ]
    };

    // Act
    const result = createTrunkRequestSchema.parse(createTrunkRequest);

    // Assert
    expect(result.sendRegister).to.be.false;
    expect(result.uris[0].weight).to.be.equal(0);
    expect(result.uris[0].priority).to.be.equal(0);
    expect(result.uris[0].enabled).to.be.false;
  });

  it("checks the values sent by the client are left untouched", async function () {
    // Arrange
    const createTrunkRequest = {
      name: "My Trunk",
      sendRegister: true,
      inboundUri: "sip.fonoster.io",
      uris: [
        {
          host: "sip.provider.net",
          port: 5061,
          transport: Transport.TLS,
          user: "user",
          weight: 10,
          priority: 1,
          enabled: true
        }
      ]
    };

    // Act
    const result = createTrunkRequestSchema.parse(createTrunkRequest);

    // Assert
    expect(result.sendRegister).to.be.true;
    expect(result.uris[0].port).to.be.equal(5061);
    expect(result.uris[0].weight).to.be.equal(10);
    expect(result.uris[0].priority).to.be.equal(1);
    expect(result.uris[0].enabled).to.be.true;
  });

  it("checks a uri without a usable port reports the port, not a missing field", async function () {
    // Arrange
    const createTrunkRequest = {
      name: "My Trunk",
      inboundUri: "sip.fonoster.io",
      uris: [
        {
          host: "sip.provider.net",
          transport: Transport.TCP
        }
      ]
    };

    // Act
    const result = createTrunkRequestSchema.safeParse(createTrunkRequest);
    const issues = result.success ? [] : result.error.issues;

    // Assert
    expect(result.success).to.be.false;
    expect(issues).to.have.lengthOf(1);
    expect(issues[0].path).to.deep.equal(["uris", 0, "port"]);
    expect(issues[0].message).to.be.equal("Must be a positive number");
  });
});
