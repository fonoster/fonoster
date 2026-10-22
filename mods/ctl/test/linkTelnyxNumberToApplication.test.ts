/**
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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
import * as SDK from "@fonoster/sdk";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { linkTelnyxNumberToApplication } from "../src/utils/linkTelnyxNumberToApplication";
import { TelnyxClient } from "../src/utils/telnyxClient";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@ctl[utils/linkTelnyxNumberToApplication]", function () {
  const accessKeyId = "WO7d2kq9x4m1c8b3n6p0r5t2v9y4z7a1e3";
  const params = {
    phoneNumber: "+18095550123",
    accessKeyId,
    originationUriBase: "pstn.fonoster.com",
    applicationRef: "app-ref",
    friendlyName: "Front desk"
  };
  const client = {} as unknown as SDK.Client;
  const telnyxClient = new TelnyxClient("some-key");

  let findPhoneNumber: sinon.SinonStub;
  let listConnections: sinon.SinonStub;
  let createProfile: sinon.SinonStub;
  let createConnection: sinon.SinonStub;
  let listFqdns: sinon.SinonStub;
  let createFqdn: sinon.SinonStub;
  let assignNumber: sinon.SinonStub;
  let listFonosterTrunks: sinon.SinonStub;
  let createTrunk: sinon.SinonStub;
  let createCredentials: sinon.SinonStub;
  let listFonosterNumbers: sinon.SinonStub;
  let deleteNumber: sinon.SinonStub;
  let createNumber: sinon.SinonStub;

  beforeEach(function () {
    findPhoneNumber = sandbox
      .stub(TelnyxClient.prototype, "findPhoneNumber")
      .resolves({ id: "tn-1", phone_number: "+18095550123" });
    listConnections = sandbox
      .stub(TelnyxClient.prototype, "listFqdnConnections")
      .resolves([]);
    createProfile = sandbox
      .stub(TelnyxClient.prototype, "createOutboundVoiceProfile")
      .resolves({ id: "ovp-1" });
    createConnection = sandbox
      .stub(TelnyxClient.prototype, "createFqdnConnection")
      .resolves({
        id: "conn-1",
        connection_name: `Trunk-${accessKeyId.toLowerCase()}`,
        user_name: `fonoster${accessKeyId.toLowerCase().slice(0, 24)}`,
        password: "returned-on-create"
      });
    listFqdns = sandbox.stub(TelnyxClient.prototype, "listFqdns").resolves([]);
    createFqdn = sandbox
      .stub(TelnyxClient.prototype, "createFqdn")
      .resolves({ id: "fqdn-1", fqdn: "x", connection_id: "conn-1" });
    assignNumber = sandbox
      .stub(TelnyxClient.prototype, "assignNumberToConnection")
      .resolves();

    listFonosterTrunks = sandbox
      .stub(SDK.Trunks.prototype, "listTrunks")
      .resolves({ items: [] } as never);
    createTrunk = sandbox
      .stub(SDK.Trunks.prototype, "createTrunk")
      .resolves({ ref: "trunk-ref" });
    createCredentials = sandbox
      .stub(SDK.Credentials.prototype, "createCredentials")
      .resolves({ ref: "creds-ref" });
    listFonosterNumbers = sandbox
      .stub(SDK.Numbers.prototype, "listNumbers")
      .resolves({ items: [] } as never);
    deleteNumber = sandbox
      .stub(SDK.Numbers.prototype, "deleteNumber")
      .resolves({} as never);
    createNumber = sandbox
      .stub(SDK.Numbers.prototype, "createNumber")
      .resolves({ ref: "number-ref" });
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("creates both sides and points the number at the app", async function () {
    await linkTelnyxNumberToApplication(telnyxClient, client, params);

    expect(createProfile).to.have.been.calledOnceWithExactly(
      `OutboundProfile-${accessKeyId.toLowerCase()}`
    );
    expect(createConnection).to.have.been.calledOnce;
    const connection = createConnection.firstCall.args[0];
    expect(connection.connectionName).to.equal(
      `Trunk-${accessKeyId.toLowerCase()}`
    );
    // Telnyx user names hold up to 32 characters of letters and numbers.
    expect(connection.userName).to.have.lengthOf(32);
    expect(connection.userName).to.match(/^[a-z0-9]+$/);
    expect(connection.userName).to.equal(
      `fonoster${accessKeyId.toLowerCase().slice(0, 24)}`
    );
    expect(connection.outboundVoiceProfileId).to.equal("ovp-1");

    expect(createFqdn).to.have.been.calledOnceWithExactly({
      connectionId: "conn-1",
      fqdn: `${accessKeyId.toLowerCase()}.pstn.fonoster.com`
    });
    expect(assignNumber).to.have.been.calledOnceWithExactly("tn-1", "conn-1");

    expect(createCredentials).to.have.been.calledOnce;
    const credentials = createCredentials.firstCall.args[0];
    expect(credentials.username).to.equal(connection.userName);
    expect(credentials.password).to.equal(connection.password);

    expect(createTrunk).to.have.been.calledOnce;
    const trunk = createTrunk.firstCall.args[0];
    expect(trunk.name).to.equal("Telnyx Trunk");
    expect(trunk.inboundUri).to.equal(
      `${accessKeyId.toLowerCase()}.pstn.fonoster.com`
    );
    expect(trunk.sendRegister).to.equal(false);
    expect(trunk.outboundCredentialsRef).to.equal("creds-ref");
    expect(trunk.uris).to.deep.equal([
      {
        host: "sip.telnyx.com",
        port: 5060,
        transport: "UDP",
        enabled: true,
        weight: 10,
        priority: 10
      }
    ]);

    expect(createNumber).to.have.been.calledOnce;
    expect(createNumber.firstCall.args[0]).to.include({
      name: "Front desk",
      telUrl: "tel:+18095550123",
      appRef: "app-ref",
      trunkRef: "trunk-ref"
    });
  });

  it("reuses the trunks on both sides and only adds the number", async function () {
    const telnyxTrunk = {
      id: "conn-2",
      connection_name: `Trunk-${accessKeyId.toLowerCase()}`
    };
    const fonosterTrunk = {
      ref: "trunk-ref",
      inboundUri: `${accessKeyId.toLowerCase()}.pstn.fonoster.com`
    };

    listConnections.resolves([telnyxTrunk]);
    listFonosterTrunks.resolves({ items: [fonosterTrunk] } as never);
    listFqdns.resolves([
      { id: "fqdn-1", fqdn: fonosterTrunk.inboundUri, connection_id: "conn-2" }
    ]);

    await linkTelnyxNumberToApplication(telnyxClient, client, params);

    expect(createProfile).to.not.have.been.called;
    expect(createConnection).to.not.have.been.called;
    expect(createCredentials).to.not.have.been.called;
    expect(createFqdn).to.not.have.been.called;
    expect(assignNumber).to.have.been.calledOnceWithExactly("tn-1", "conn-2");
    expect(createTrunk).to.not.have.been.called;
    expect(createNumber.firstCall.args[0]).to.include({
      trunkRef: "trunk-ref"
    });
  });

  it("replaces a number already in the workspace", async function () {
    listFonosterNumbers.resolves({
      items: [{ ref: "old-number-ref", telUrl: "tel:+18095550123" }]
    } as never);

    await linkTelnyxNumberToApplication(telnyxClient, client, params);

    expect(deleteNumber).to.have.been.calledOnceWithExactly("old-number-ref");
    expect(createNumber).to.have.been.calledOnce;
  });

  it("refuses a number that is not in the Telnyx account", async function () {
    findPhoneNumber.resolves(undefined);

    await expect(
      linkTelnyxNumberToApplication(telnyxClient, client, params)
    ).to.be.rejectedWith(
      "The number +18095550123 was not found in your account."
    );
    expect(createProfile).to.not.have.been.called;
    expect(createTrunk).to.not.have.been.called;
    expect(createNumber).to.not.have.been.called;
  });
});
