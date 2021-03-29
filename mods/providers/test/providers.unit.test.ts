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
import Providers from "../src/providers";
import chaiAsPromised from "chai-as-promised";
import {FonosService, ProvidersPB} from "@fonos/core";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@Fonos/providers", () => {
  const providerAPI = new Providers();

  const providerObj = new ProvidersPB.Provider();
  providerObj.setRef("Nx05y-ldZa");
  providerObj.setName("Acme Corp");
  providerObj.setUsername("test");
  providerObj.setSecret("uio3uwd12s23")
  providerObj.setHost("fonoster.api.io")
  providerObj.setTransport("tcp")
  providerObj.setExpires(3600)
  providerObj.setUpdateTime("...");
  providerObj.setCreateTime("...");

  sandbox.stub(FonosService.prototype, "init").returns();

  afterEach(() => sandbox.restore());

  it("should create a provider", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        createProvider: () => {
          return {
            sendMessage: () => Promise.resolve(providerObj)
          };
        }
      });

    const req = {
    
      ref: "",
      name: "orange",
      username: "test",
      secret: "uio3uwd12s23",
      host: "fonos.api.io",
      transport: "tcp",
      expires: 3600,
      createdTime: "...",
      updatedTime: "..."

    };

    const result = await providerAPI.createProvider(req);

    expect(result).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(result).to.have.property("name").to.be.equal("Acme Corp");
    expect(result).to.have.property("host").to.be.equal("fonoster.api.io");
    expect(result).to.have.property("transport").to.be.equal("tcp");
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;

    expect(serviceStub).to.have.been.calledOnce;
  });

  it("should get a provider", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        getProvider: () => {
          return {
            sendMessage: () => Promise.resolve(providerObj)
          };
        }
      });

    const request = "Nx05y-ldZa";
    const res = await providerAPI.getProvider(request);

    expect(res).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(res).to.have.property("name").to.be.equal("Acme Corp");
    expect(res).to.have.property("host").to.be.equal("fonoster.api.io");
    expect(res).to.have.property("transport").to.be.equal("tcp");
    expect(res).to.have.property("createTime").not.to.be.null;
    expect(res).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledOnce;
  });

  it("should delete a Provider", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        deleteProvider: () => {
          return {
            sendMessage: () => Promise.resolve({ref: "Nx05y-ldZa"})
          };
        }
      });

    const ref = "Nx05y-ldZa";
    const res = await providerAPI.deleteProvider(ref);

    expect(serviceStub).to.have.been.calledOnce;
    expect(res).to.have.property("ref").to.be.equal(ref);
  });

  it("should list providers", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        listProviders: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getNextPageToken: () => "1",
                getDomainsList: () => [providerObj]
              })
          };
        }
      });

    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    const result = await providerAPI.listProviders(request);

    expect(serviceStub).to.be.calledOnce;
    expect(result).to.have.property("nextPageToken").to.be.equal("1");
    expect(result.providers[0]).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(result.providers[0]).to.have.property("name").to.be.equal("Acme Corp");
    expect(result.providers[0]).to.have.property("host").to.be.equal("fonoster.api.io");
    expect(result.providers[0]).to.have.property("transport").to.be.equal("tcp");
    expect(result.providers[0]).to.have.property("createTime").not.to.be.null;
    expect(result.providers[0]).to.have.property("updateTime").not.to.be.null;
  });

  it("should update a provider (name)", async () => {
    const request = {
      ref: "Nx05y-ldZa",
      name: "Acme Corp",
      username: "test",
      secret: "uio3uwd12s23",
      host: "fonos.api.io",
      transport: "tcp",
      expires: 3600,
      createdTime: "...",
      updatedTime: "..."

    };

    const returnProvider = {

      ref: "Nx05y-ldZa",
      name: "Acme Corp",
      username: "test",
      secret: "uio3uwd12s23",
      host: "fonos.api.io",
      transport: "tcp",
      expires: 3600,
      createdTime: "...",
      updatedTime: "..."

    };

    sandbox.stub(providerAPI, "getProvider").resolves(returnProvider);

    const updateDomainStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        updateDomain: () => {
          return {
            sendMessage: () => Promise.resolve({getRef: () => "Nx05y-ldZa"})
          };
        },
        getDomain: () => {
          return {
            sendMessage: () => Promise.resolve(providerObj)
          };
        }
      });

    const result = await providerAPI.updateProvider(request);
    expect(result).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(updateDomainStub).to.be.calledTwice;
  });
});
