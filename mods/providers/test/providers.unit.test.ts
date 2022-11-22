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
import { APIClient } from "@fonoster/common";
import Providers, { ProvidersPB } from "../src/client/providers";
import providerDecoder from "../src/service/decoder";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/providers", () => {
  const providerObj = new ProvidersPB.Provider();
  providerObj.setRef("Nx05y-ldZa");
  providerObj.setName("Fake Provider");
  providerObj.setUsername("test");
  providerObj.setSecret("uio3uwd12s23");
  providerObj.setHost("sip.provider.net");
  providerObj.setTransport("tcp");
  providerObj.setExpires(600);
  providerObj.setUpdateTime("...");
  providerObj.setCreateTime("...");

  afterEach(() => sandbox.restore());

  it("should create a provider", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        createProvider: () => {
          return {
            sendMessage: () => Promise.resolve(providerObj)
          };
        }
      });

    const req = {
      name: providerObj.getName(),
      username: providerObj.getUsername(),
      secret: providerObj.getSecret(),
      host: providerObj.getHost(),
      transport: providerObj.getTransport(),
      expires: providerObj.getExpires(),
      createTime: providerObj.getCreateTime(),
      updateTime: providerObj.getUpdateTime()
    };

    const providerAPI = new Providers();
    const result = await providerAPI.createProvider(req);

    expect(result).to.have.property("ref").to.be.equal(providerObj.getRef());
    expect(result).to.have.property("name").to.be.equal(providerObj.getName());
    expect(result).to.have.property("host").to.be.equal(providerObj.getHost());
    expect(result)
      .to.have.property("transport")
      .to.be.equal(providerObj.getTransport());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;

    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should get a provider", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        getProvider: () => {
          return {
            sendMessage: () => Promise.resolve(providerObj)
          };
        }
      });

    const request = "Nx05y-ldZa";

    const providerAPI = new Providers();
    const result = await providerAPI.getProvider(request);

    expect(result).to.have.property("ref").to.be.equal(providerObj.getRef());
    expect(result).to.have.property("name").to.be.equal(providerObj.getName());
    expect(result).to.have.property("host").to.be.equal(providerObj.getHost());
    expect(result)
      .to.have.property("transport")
      .to.be.equal(providerObj.getTransport());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should delete a Provider", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        deleteProvider: () => {
          return {
            sendMessage: () => Promise.resolve({ ref: providerObj.getRef() })
          };
        }
      });

    const providerAPI = new Providers();
    const res = await providerAPI.deleteProvider(providerObj.getRef());
    expect(serviceStub).to.have.been.calledTwice;
    expect(res).to.have.property("ref").to.be.equal(providerObj.getRef());
  });

  it("should list providers", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        listProviders: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getNextPageToken: () => "1",
                getProvidersList: () => [providerObj]
              })
          };
        }
      });

    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    const providerAPI = new Providers();
    const result = await providerAPI.listProviders(request);

    expect(serviceStub).to.be.calledTwice;
    expect(result).to.have.property("nextPageToken").to.be.equal("1");
    expect(result.providers[0])
      .to.have.property("ref")
      .to.be.equal(providerObj.getRef());
    expect(result.providers[0])
      .to.have.property("name")
      .to.be.equal(providerObj.getName());
    expect(result.providers[0])
      .to.have.property("host")
      .to.be.equal(providerObj.getHost());
    expect(result.providers[0])
      .to.have.property("transport")
      .to.be.equal(providerObj.getTransport());
    expect(result.providers[0]).to.have.property("createTime").not.to.be.null;
    expect(result.providers[0]).to.have.property("updateTime").not.to.be.null;
  });

  it("should update a provider (name)", async () => {
    const request = {
      ref: providerObj.getRef(),
      name: providerObj.getName()
    };

    const returnProvider = {
      ref: providerObj.getRef(),
      name: providerObj.getName(),
      username: providerObj.getName(),
      secret: providerObj.getName(),
      host: providerObj.getName(),
      transport: providerObj.getName(),
      expires: providerObj.getName(),
      createTime: providerObj.getCreateTime(),
      updateTime: providerObj.getUpdateTime()
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    const updateProviderStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        updateProvider: () => {
          return {
            sendMessage: () =>
              Promise.resolve({ getRef: () => returnProvider.ref })
          };
        },
        getProvider: () => {
          return {
            sendMessage: () => Promise.resolve(providerObj)
          };
        }
      });

    const providerAPI = new Providers();
    const result = await providerAPI.updateProvider(request);
    expect(result).to.have.property("ref").to.be.equal(returnProvider.ref);
    expect(updateProviderStub).to.be.calledTwice;
  });

  context("provider decoder", () => {
    let jsonObj;

    beforeEach(() => {
      jsonObj = {
        metadata: {
          ref: "001",
          name: "provider002",
          createdOn: "DATE",
          modifiedOn: "DATE"
        },
        spec: {
          host: "127.0.0.1",
          transport: "tcp",
          expires: 0,
          credentials: {
            username: "trunk001",
            secret: "1234"
          }
        }
      };
    });

    it("should create a provider object from a json object", () => {
      const provider = providerDecoder(jsonObj);
      expect(provider.getRef()).to.be.equal(jsonObj.metadata.ref);
      expect(provider.getName()).to.be.equal(jsonObj.metadata.name);
      expect(provider.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn);
      expect(provider.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn);
      expect(provider.getHost()).to.be.equal(jsonObj.spec.host);
      expect(provider.getTransport()).to.be.equal(jsonObj.spec.transport);
      expect(provider.getExpires()).to.be.equal(jsonObj.spec.expires);
      expect(provider.getUsername()).to.be.equal(
        jsonObj.spec.credentials.username
      );
      expect(provider.getSecret()).to.be.equal(jsonObj.spec.credentials.secret);
    });

    it("should create a provider object from a json object without credentials", () => {
      delete jsonObj.spec.credentials;
      const provider = providerDecoder(jsonObj);
      expect(provider.getRef()).to.be.equal(jsonObj.metadata.ref);
      expect(provider.getName()).to.be.equal(jsonObj.metadata.name);
      expect(provider.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn);
      expect(provider.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn);
      expect(provider.getHost()).to.be.equal(jsonObj.spec.host);
      expect(provider.getTransport()).to.be.equal(jsonObj.spec.transport);
      expect(provider.getExpires()).to.be.equal(jsonObj.spec.expires);
      expect(provider.getUsername()).to.be.a("string").lengthOf(0);
      expect(provider.getSecret()).to.be.a("string").lengthOf(0);
    });
  });
});
