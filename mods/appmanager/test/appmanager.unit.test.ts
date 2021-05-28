/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import AppManager from "../src/client/appmanager";
import chaiAsPromised from "chai-as-promised";
import {FonosService} from "@fonos/core";
import AppManagerPB from "../src/service/protos/appmanager_pb";
import {App} from "../src/service/protos/appmanager_pb";
import {DeployAppRequest} from "../src/types";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@Fonos/appmanager", () => {
  const appObj = new AppManagerPB.App();
  appObj.setRef("IkvhghVpvv");
  appObj.setName("15");
  appObj.setDescription("this is a test");
  appObj.setUpdateTime("...");
  appObj.setCreateTime("...");
  appObj.setStatus(App.Status.CREATING);

  const dirPath = "mods/appmanager/etc/hello-monkeys";

  afterEach(() => sandbox.restore());

  it("should deploy an app", async () => {
    sandbox.stub(FonosService.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        deployApp: () => {
          return {
            sendMessage: () => Promise.resolve(appObj)
          };
        },
        uploadObject: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                stream: {
                  write() {
                    0;
                  },
                  end() {
                    0;
                  }
                }
              })
          };
        },
        createApp: () => {
          return {
            sendMessage: () => Promise.resolve(appObj)
          };
        }
      });
    const req = {
      ref: appObj.getRef(),
      name: appObj.getName(),
      description: appObj.getDescription(),
      createTime: appObj.getUpdateTime(),
      updateTime: appObj.getUpdateTime(),
      status: appObj.getStatus()
    };

    const appAPI = new AppManager();
    const request: DeployAppRequest = {path: dirPath, ref: req.ref};
    const result = await appAPI.deployApp(request);

    expect(result).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(result).to.have.property("name").to.be.equal(appObj.getName());
    expect(result)
      .to.have.property("description")
      .to.be.equal(appObj.getDescription());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;

    expect(serviceStub).to.have.been.called;
  });

  it("should get an app", async () => {
    sandbox.stub(FonosService.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        getApp: () => {
          return {
            sendMessage: () => Promise.resolve(appObj)
          };
        }
      });

    const request = "IkvhghVpvv";

    const appAPI = new AppManager();
    const result = await appAPI.getApp(request);

    expect(result).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(result).to.have.property("name").to.be.equal(appObj.getName());
    expect(result)
      .to.have.property("description")
      .to.be.equal(appObj.getDescription());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.called;
  });

  it("should delete an app", async () => {
    sandbox.stub(FonosService.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        deleteApp: () => {
          return {
            sendMessage: () => Promise.resolve({ref: "IkvhghVpvv"})
          };
        }
      });
    const appAPI = new AppManager();
    const result = await appAPI.deleteApp(appObj.getRef());

    expect(serviceStub).to.have.been.called;
    expect(result).to.have.property("ref").to.be.equal(appObj.getRef());
  });

  it("should list apps", async () => {
    sandbox.stub(FonosService.prototype, "init").returns();
    sandbox.stub(FonosService.prototype, "getService").returns({
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

    const appAPI = new AppManager();
    const result = await appAPI.listApps(request);

    expect(result.apps[0]).to.have.property("ref").to.be.equal(appObj.getRef());
    expect(result.apps[0])
      .to.have.property("name")
      .to.be.equal(appObj.getName());
    expect(result.apps[0])
      .to.have.property("description")
      .to.be.equal(appObj.getDescription());
    expect(result.apps[0]).to.have.property("createTime").not.to.be.null;
    expect(result.apps[0]).to.have.property("updateTime").not.to.be.null;
  });
});
