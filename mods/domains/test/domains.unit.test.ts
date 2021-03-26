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
import Domains from "../src/domains";
import chaiAsPromised from "chai-as-promised";
import { FonosService, DomainsPB } from "@fonos/core";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@Fonos/domains", () => {

  const domainsAPI = new Domains();

  const domainObj = new DomainsPB.Domain();
  domainObj.setRef("Nx05y-ldZa");
  domainObj.setName("Acme Corp");
  domainObj.setDomainUri("sip.acme.com");
  domainObj.setEgressRule(".*");
  domainObj.setEgressNumberRef("cb8V0CNTfH");
  domainObj.setAccessDenyList(["10.0.0.1"]);
  domainObj.setAccessAllowList(["10.0.0.2"]);
  domainObj.setUpdateTime("...");
  domainObj.setCreateTime("...");

  sandbox.stub(FonosService.prototype, 'init').returns()

  afterEach(() => sandbox.restore())

  it("should create a domain", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        createDomain: () => {
          return {
            sendMessage: () =>
              Promise.resolve(domainObj)
          }
        }
      });

    const req = {
      name: "Acme Corp",
      domainUri: "sip.acme.com",
      egressRule: ".*",
      egressNumberRef: "cb8V0CNTfH"
    };

    const result = await domainsAPI.createDomain(req);

    expect(result).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(result).to.have.property("name").to.be.equal("Acme Corp");
    expect(result).to.have.property("domainUri").to.be.equal("sip.acme.com");
    expect(result).to.have.property("egressRule").to.be.equal(".*");
    expect(result).to.have.property("egressNumberRef").to.be.equal("cb8V0CNTfH");
    expect(result).to.have.property("accessDeny").to.be.lengthOf(1);
    expect(result).to.have.property("accessAllow").to.be.lengthOf(1);
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;

    expect(serviceStub).to.have.been.calledOnce;
  })

  it("should get a domain", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        getDomain: () => {
          return {
            sendMessage: () =>
              Promise.resolve(domainObj)
          }
        }
      });

    const request = "Nx05y-ldZa";
    const res = await domainsAPI.getDomain(request);
    
    expect(res).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(res).to.have.property("name").to.be.equal("Acme Corp");
    expect(res).to.have.property("domainUri").to.be.equal("sip.acme.com");
    expect(res).to.have.property("egressRule").to.be.equal(".*");
    expect(res).to.have.property("egressNumberRef").to.be.equal("cb8V0CNTfH");
    expect(res).to.have.property("accessDeny").to.be.lengthOf(1);
    expect(res).to.have.property("accessAllow").to.be.lengthOf(1);
    expect(res).to.have.property("createTime").not.to.be.null;
    expect(res).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledOnce;

  })

  it("should delete a Domain", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        deleteDomain: () => {
          return {
            sendMessage: () =>
              Promise.resolve({ref: "Nx05y-ldZa"})
          }
        }
      });

    const ref = "Nx05y-ldZa";
    const res = await domainsAPI.deleteDomain(ref);
    
    expect(serviceStub).to.have.been.calledOnce;
    expect(res).to.have.property("ref").to.be.equal(ref);
  })

  it("should list domains", async () => {
    const serviceStub = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        listDomains: () => {
          return {
            sendMessage: (() => Promise.resolve({
              getNextPageToken: () => "1",
              getDomainsList: ()=> [
                domainObj
              ]
            }))
          }
        }
      });

    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };
    
    const result = await domainsAPI.listDomains(request);

    expect(serviceStub).to.be.calledOnce;
    expect(result).to.have.property("nextPageToken").to.be.equal("1");
    expect(result.domains[0]).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(result.domains[0]).to.have.property("name").to.be.equal("Acme Corp");
    expect(result.domains[0]).to.have.property("domainUri").to.be.equal("sip.acme.com");
    expect(result.domains[0]).to.have.property("egressRule").to.be.equal(".*");
    expect(result.domains[0]).to.have.property("egressNumberRef").to.be.equal("cb8V0CNTfH");
    expect(result.domains[0]).to.have.property("accessDeny").to.be.lengthOf(1)
    expect(result.domains[0]).to.have.property("accessAllow").to.be.lengthOf(1)
  })

  it("should update a domain (name)", async () => {
    const request = {
      ref: "Nx05y-ldZa",
      name: "Acme Corp."
    };

    const returnDomain = { 
      ref: "Nx05y-ldZa",
      name: "Acme Corp",
      domainUri: "sip.acme.com",
      egressRule: ".*",
      egressNumberRef: 'cb8V0CNTfH',
      accessDeny: [""],
      accessAllow: [""],
      createdTime: "...",
      updatedTime: "..."
    };

    sandbox.stub(domainsAPI, "getDomain").resolves(returnDomain as any)

    const updateDomainStub = sandbox.stub(FonosService.prototype, "getService")
      .returns({
        updateDomain: () => {
          return {
            sendMessage: (() => Promise.resolve({getRef: () => "Nx05y-ldZa"}))
          }
        },
        getDomain: () => {
          return {
            sendMessage: (() => Promise.resolve(domainObj))
          }
        }
      });

    const result = await domainsAPI.updateDomain(request);
    expect(result).to.have.property("ref").to.be.equal("Nx05y-ldZa");
    expect(updateDomainStub).to.be.calledTwice;
 })

})
