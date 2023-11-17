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
import Domains from "../src/client/domains";
import chaiAsPromised from "chai-as-promised";
import { APIClient } from "@fonoster/common";
import DomainsPB from "../src/service/protos/domains_pb";
import domainDecoder from "../src/service/decoder";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/domains", () => {
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

  afterEach(() => sandbox.restore());

  it("should create a domain", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        createDomain: () => {
          return {
            sendMessage: () => Promise.resolve(domainObj)
          };
        }
      });

    const req = {
      name: domainObj.getName(),
      domainUri: domainObj.getDomainUri(),
      egressRule: domainObj.getEgressRule(),
      egressNumberRef: domainObj.getEgressNumberRef()
    };

    const domainsAPI = new Domains();
    const result = await domainsAPI.createDomain(req);

    expect(result).to.have.property("ref").to.be.equal(domainObj.getRef());
    expect(result).to.have.property("name").to.be.equal(domainObj.getName());
    expect(result)
      .to.have.property("domainUri")
      .to.be.equal(domainObj.getDomainUri());
    expect(result)
      .to.have.property("egressRule")
      .to.be.equal(domainObj.getEgressRule());
    expect(result)
      .to.have.property("egressNumberRef")
      .to.be.equal(domainObj.getEgressNumberRef());
    expect(result).to.have.property("accessDeny").to.be.lengthOf(1);
    expect(result).to.have.property("accessAllow").to.be.lengthOf(1);
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;

    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should get a domain", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        getDomain: () => {
          return {
            sendMessage: () => Promise.resolve(domainObj)
          };
        }
      });

    const request = "Nx05y-ldZa";

    const domainsAPI = new Domains();
    const result = await domainsAPI.getDomain(request);

    expect(result).to.have.property("ref").to.be.equal(domainObj.getRef());
    expect(result).to.have.property("name").to.be.equal(domainObj.getName());
    expect(result)
      .to.have.property("domainUri")
      .to.be.equal(domainObj.getDomainUri());
    expect(result)
      .to.have.property("egressRule")
      .to.be.equal(domainObj.getEgressRule());
    expect(result)
      .to.have.property("egressNumberRef")
      .to.be.equal(domainObj.getEgressNumberRef());
    expect(result).to.have.property("accessDeny").to.be.lengthOf(1);
    expect(result).to.have.property("accessAllow").to.be.lengthOf(1);
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should delete a Domain", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        deleteDomain: () => {
          return {
            sendMessage: () => Promise.resolve({ ref: "Nx05y-ldZa" })
          };
        }
      });

    const domainsAPI = new Domains();
    const res = await domainsAPI.deleteDomain(domainObj.getRef());

    expect(serviceStub).to.have.been.calledTwice;
    expect(res).to.have.property("ref").to.be.equal(domainObj.getRef());
  });

  it("should list domains", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        listDomains: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getNextPageToken: () => "1",
                getDomainsList: () => [domainObj]
              })
          };
        }
      });

    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    const domainsAPI = new Domains();
    const result = await domainsAPI.listDomains(request);

    expect(serviceStub).to.be.calledTwice;
    expect(result.domains[0])
      .to.have.property("ref")
      .to.be.equal(domainObj.getRef());
    expect(result.domains[0])
      .to.have.property("name")
      .to.be.equal(domainObj.getName());
    expect(result.domains[0])
      .to.have.property("domainUri")
      .to.be.equal(domainObj.getDomainUri());
    expect(result.domains[0])
      .to.have.property("egressRule")
      .to.be.equal(domainObj.getEgressRule());
    expect(result.domains[0])
      .to.have.property("egressNumberRef")
      .to.be.equal(domainObj.getEgressNumberRef());
    expect(result.domains[0]).to.have.property("accessDeny").to.be.lengthOf(1);
    expect(result.domains[0]).to.have.property("accessAllow").to.be.lengthOf(1);
  });

  it("should update a domain (name)", async () => {
    const request = {
      ref: domainObj.getRef(),
      name: domainObj.getName()
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    const updateDomainStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        updateDomain: () => {
          return {
            sendMessage: () =>
              Promise.resolve({ getRef: () => domainObj.getRef() })
          };
        },
        getDomain: () => {
          return {
            sendMessage: () => Promise.resolve(domainObj)
          };
        }
      });

    const domainsAPI = new Domains();
    const result = await domainsAPI.updateDomain(request);
    expect(result).to.have.property("ref").to.be.equal(domainObj.getRef());
    expect(updateDomainStub).to.be.calledTwice;
  });

  context("domain decoder", () => {
    let jsonObj;

    beforeEach(() => {
      jsonObj = {
        metadata: {
          ref: "001",
          name: "Peter",
          createdOn: "DATE",
          modifiedOn: "DATE"
        },
        spec: {
          context: {
            domainUri: "sip.local",
            egressPolicy: {
              rule: ".*",
              numberRef: "001"
            },
            accessControlList: {
              allow: ["192.168.1.1", "10.0.0.1"],
              deny: ["0.0.0.0/31"]
            }
          }
        }
      };
    });

    it("should create a domain object from a json object w/ no acl", () => {
      delete jsonObj.spec.context.accessControlList;
      const domains = domainDecoder(jsonObj);
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref);
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name);
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn);
      expect(domains.getEgressRule()).to.be.equal(
        jsonObj.spec.context.egressPolicy.rule
      );
      expect(domains.getEgressNumberRef()).to.be.equal(
        jsonObj.spec.context.egressPolicy.numberRef
      );
      expect(domains.getAccessDenyList()).to.be.a("array").lengthOf(0);
      expect(domains.getAccessAllowList()).to.be.a("array").lengthOf(0);
    });

    it("should create a domain object from a json object w/ no egress policy", () => {
      delete jsonObj.spec.context.egressPolicy;
      const domains = domainDecoder(jsonObj);
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref);
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name);
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn);
      expect(domains.getEgressRule()).to.be.a("string").lengthOf(0);
      expect(domains.getEgressNumberRef()).to.be.a("string").lengthOf(0);
      expect(domains.getAccessDenyList()).to.be.a("array").lengthOf(1);
      expect(domains.getAccessAllowList()).to.be.a("array").lengthOf(2);
    });

    it("should create a domain object from a json object", () => {
      const domains = domainDecoder(jsonObj);
      expect(domains.getRef()).to.be.equal(jsonObj.metadata.ref);
      expect(domains.getName()).to.be.equal(jsonObj.metadata.name);
      expect(domains.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn);
      expect(domains.getEgressRule()).to.be.equal(
        jsonObj.spec.context.egressPolicy.rule
      );
      expect(domains.getEgressNumberRef()).to.be.equal(
        jsonObj.spec.context.egressPolicy.numberRef
      );
      expect(domains.getAccessDenyList()).to.be.a("array").lengthOf(1);
      expect(domains.getAccessAllowList()).to.be.a("array").lengthOf(2);
    });
  });
});
