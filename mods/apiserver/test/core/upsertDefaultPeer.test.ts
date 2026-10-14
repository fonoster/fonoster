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
import SDK from "@routr/sdk";
import * as chai from "chai";
import { expect } from "chai";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[core/upsertDefaultPeer]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("retries while Routr isn't reachable, then creates the peer", async function () {
    // Arrange
    const createPeer = sandbox.stub(SDK.Peers.prototype, "createPeer");
    createPeer
      .onFirstCall()
      .rejects(new Error("Cannot connect to service [routr:51907]"));
    createPeer.onSecondCall().resolves({ ref: "peer-1" } as never);
    const updatePeer = sandbox
      .stub(SDK.Peers.prototype, "updatePeer")
      .resolves({} as never);
    sandbox
      .stub(SDK.Credentials.prototype, "createCredentials")
      .resolves({ ref: "creds-1" } as never);

    const { upsertDefaultPeer } = await import(
      "../../src/core/upsertDefaultPeer"
    );

    // Act
    await upsertDefaultPeer(1, 1);

    // Assert
    expect(createPeer).to.have.been.calledTwice;
    expect(updatePeer).to.have.been.calledWithMatch({
      credentialsRef: "creds-1"
    });
  });

  it("stops when the peer already exists", async function () {
    // Arrange
    const createPeer = sandbox
      .stub(SDK.Peers.prototype, "createPeer")
      .rejects(new Error("peer already exist"));

    const { upsertDefaultPeer } = await import(
      "../../src/core/upsertDefaultPeer"
    );

    // Act
    await upsertDefaultPeer(1, 1);

    // Assert
    expect(createPeer).to.have.been.calledOnce;
  });
});
