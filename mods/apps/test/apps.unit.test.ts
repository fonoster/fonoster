/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import Apps from "../src/client/apps";
import { APIClient } from "@fonoster/common";
import AppsPB from "../src/service/protos/apps_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/apps/client", () => {
  const transferConfig = new AppsPB.TransferConfig();
  transferConfig.setMessage("transfering");
  const appObj = new AppsPB.App();
  appObj.setRef("Nx05y-ldZa");
  appObj.setName("my app");
  appObj.setInitialDtmf("1234");
  appObj.setActivationIntentId("activate.bot");
  appObj.setActivationTimeout(3000);
  appObj.setInteractionTimeout(4000);
  appObj.setEnableEvents(false);
  appObj.setTransferConfig(transferConfig);
  appObj.setIntentsEngineConfig(
    Struct.fromJavaScript({
      projectId: "my-project",
      secretName: "my-secret"
    }) as unknown as Struct
  );
  appObj.setSpeechConfig(
    Struct.fromJavaScript({
      voice: "en-US-Wavenet-F",
      secretName: "my-secret"
    }) as unknown as Struct
  );
  appObj.setCreateTime("...");
  appObj.setUpdateTime("...");

  afterEach(() => sandbox.restore());

  it("should create an app", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        createApp: () => {
          return {
            sendMessage: () => Promise.resolve(appObj)
          };
        }
      });

    const req = {
      name: appObj.getName(),
      speechConfig: {
        languageCode: "",
        voice: "my-project",
        secretName: "my-secret"
      },
      intentsEngineConfig: {
        projectId: "my-project",
        secretName: "my-secret"
      }
    };

    const appsAPI = new Apps();
    const result = await appsAPI.createApp(req);

    expect(result).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(result).to.have.property("name").to.be.equal(appObj.getName());
    expect(result)
      .to.have.property("initialDtmf")
      .to.be.equal(appObj.getInitialDtmf());
    expect(result)
      .to.have.property("activationIntentId")
      .to.be.equal(appObj.getActivationIntentId());
    expect(result)
      .to.have.property("activationTimeout")
      .to.be.equal(appObj.getActivationTimeout());
    expect(result)
      .to.have.property("interactionTimeout")
      .to.be.equal(appObj.getInteractionTimeout());
    expect(result)
      .to.have.property("enableEvents")
      .to.be.equal(appObj.getEnableEvents());
    expect(result)
      .to.have.property("intentsEngineConfig")
      .to.be.deep.equal(appObj.getIntentsEngineConfig().toJavaScript());
    expect(result)
      .to.have.property("speechConfig")
      .to.be.deep.equal(appObj.getSpeechConfig().toJavaScript());
    expect(result)
      .to.have.property("transferConfig")
      .to.have.property("message")
      .to.be.equal(appObj.getTransferConfig().getMessage());
    expect(result)
      .to.have.property("transferConfig")
      .to.have.property("messageBusy")
      .to.be.equal(appObj.getTransferConfig().getMediaBusy());
    expect(result)
      .to.have.property("transferConfig")
      .to.have.property("messageNoAnswer")
      .to.be.equal(appObj.getTransferConfig().getMessageNoAnswer());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should get an app", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        getApp: () => {
          return {
            sendMessage: () => Promise.resolve(appObj)
          };
        }
      });

    const request = "Nx05y-ldZa";

    const appsAPI = new Apps();
    const result = await appsAPI.getApp(request);

    expect(result).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(result).to.have.property("name").to.be.equal(appObj.getName());
    expect(result)
      .to.have.property("initialDtmf")
      .to.be.equal(appObj.getInitialDtmf());
    expect(result)
      .to.have.property("activationIntentId")
      .to.be.equal(appObj.getActivationIntentId());
    expect(result)
      .to.have.property("activationTimeout")
      .to.be.equal(appObj.getActivationTimeout());
    expect(result)
      .to.have.property("interactionTimeout")
      .to.be.equal(appObj.getInteractionTimeout());
    expect(result)
      .to.have.property("enableEvents")
      .to.be.equal(appObj.getEnableEvents());
    expect(result)
      .to.have.property("intentsEngineConfig")
      .to.be.deep.equal(appObj.getIntentsEngineConfig().toJavaScript());
    expect(result)
      .to.have.property("speechConfig")
      .to.be.deep.equal(appObj.getSpeechConfig().toJavaScript());
    expect(result)
      .to.have.property("transferConfig")
      .to.have.property("message")
      .to.be.equal(appObj.getTransferConfig().getMessage());
    expect(result)
      .to.have.property("transferConfig")
      .to.have.property("messageBusy")
      .to.be.equal(appObj.getTransferConfig().getMediaBusy());
    expect(result)
      .to.have.property("transferConfig")
      .to.have.property("messageNoAnswer")
      .to.be.equal(appObj.getTransferConfig().getMessageNoAnswer());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should delete an app", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        deleteApp: () => {
          return {
            sendMessage: () => Promise.resolve({ ref: "Nx05y-ldZa" })
          };
        }
      });

    const domainsAPI = new Apps();
    const res = await domainsAPI.deleteApp(appObj.getRef());

    expect(serviceStub).to.have.been.calledTwice;
    expect(res).to.have.property("ref").to.be.equal(appObj.getRef());
  });

  it("should list domains", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        listApps: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getNextPageToken: () => "1",
                getAppsList: () => [appObj]
              })
          };
        }
      });

    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    const appsAPI = new Apps();
    const result = await appsAPI.listApps(request);

    expect(serviceStub).to.be.calledTwice;
    expect(result.apps[0]).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(result.apps[0])
      .to.have.property("name")
      .to.be.equal(appObj.getName());
    expect(result.apps[0]).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(result.apps[0])
      .to.have.property("name")
      .to.be.equal(appObj.getName());
    expect(result.apps[0])
      .to.have.property("initialDtmf")
      .to.be.equal(appObj.getInitialDtmf());
    expect(result.apps[0])
      .to.have.property("activationIntentId")
      .to.be.equal(appObj.getActivationIntentId());
    expect(result.apps[0])
      .to.have.property("activationTimeout")
      .to.be.equal(appObj.getActivationTimeout());
    expect(result.apps[0])
      .to.have.property("interactionTimeout")
      .to.be.equal(appObj.getInteractionTimeout());
    expect(result.apps[0])
      .to.have.property("enableEvents")
      .to.be.equal(appObj.getEnableEvents());
    expect(result.apps[0])
      .to.have.property("intentsEngineConfig")
      .to.be.deep.equal(appObj.getIntentsEngineConfig().toJavaScript());
    expect(result.apps[0])
      .to.have.property("speechConfig")
      .to.be.deep.equal(appObj.getSpeechConfig().toJavaScript());
    expect(result.apps[0])
      .to.have.property("transferConfig")
      .to.have.property("message")
      .to.be.equal(appObj.getTransferConfig().getMessage());
    expect(result.apps[0])
      .to.have.property("transferConfig")
      .to.have.property("messageBusy")
      .to.be.equal(appObj.getTransferConfig().getMediaBusy());
    expect(result.apps[0])
      .to.have.property("transferConfig")
      .to.have.property("messageNoAnswer")
      .to.be.equal(appObj.getTransferConfig().getMessageNoAnswer());
    expect(result.apps[0]).to.have.property("createTime").not.to.be.null;
    expect(result.apps[0]).to.have.property("updateTime").not.to.be.null;
  });

  it("should update the app", async () => {
    const request = {
      ref: appObj.getRef(),
      name: appObj.getName(),
      initialDtmf: "1234",
      transferConfig: {
        message: appObj.getTransferConfig().getMessage(),
        messageBusy: appObj.getTransferConfig().getMessageBusy(),
        messageNoAnswer: appObj.getTransferConfig().getMessageNoAnswer()
      },
      intentsEngineConfig: appObj
        .getIntentsEngineConfig()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .toJavaScript() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      speechConfig: appObj.getSpeechConfig().toJavaScript() as any
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    const updateDomainStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        updateApp: () => {
          return {
            sendMessage: (a) => {
              const t1 = a.getTransferConfig();
              const t2 = request.transferConfig;
              expect(t1.getMessage()).to.equal(t2.message);
              expect(t1.getMessageBusy()).to.equal(t2.messageBusy);
              expect(t1.getMessageNoAnswer()).to.be.equal(t2.messageNoAnswer);
              expect(a.getSpeechConfig().toJavaScript()).to.be.deep.equal(
                appObj.getSpeechConfig().toJavaScript()
              );
              expect(
                a.getIntentsEngineConfig().toJavaScript()
              ).to.be.deep.equal(
                appObj.getIntentsEngineConfig().toJavaScript()
              );
              return Promise.resolve({ getRef: () => appObj.getRef() });
            }
          };
        }
      });

    const appsAPI = new Apps();
    const result = await appsAPI.updateApp(request);
    expect(result).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(updateDomainStub).to.be.calledTwice;
  });
});
