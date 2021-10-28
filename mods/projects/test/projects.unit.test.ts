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
import Projects, {ProjectsPB} from "../src/client/projects";
import chaiAsPromised from "chai-as-promised";
import {APIClient} from "@fonos/common";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/projects", () => {
  const projectObj = new ProjectsPB.Project();
  projectObj.setRef("Nx05y-ldZa");
  projectObj.setName("John Doe");
  projectObj.setUserRef("Ux0ey-cdZa");
  projectObj.setAccessKeyId("Nx05y-ldZa");
  projectObj.setAccessKeySecret("...");
  projectObj.setAllowExperiments(false);
  projectObj.setCreateTime("Nx05y-ldZa");
  projectObj.setUpdateTime("Nx05y-ldZa");

  afterEach(() => sandbox.restore());

  it("should create a project", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        createProject: () => {
          return {
            sendMessage: () => Promise.resolve(projectObj)
          };
        }
      });

    const req = {
      name: projectObj.getName(),
      allowExperiments: false
    };

    const projectsAPI = new Projects();
    const result = await projectsAPI.createProject(req);

    expect(result).to.have.property("ref").to.be.equal(projectObj.getRef());
    expect(result).to.have.property("name").to.be.equal(projectObj.getName());
    expect(result)
      .to.have.property("userRef")
      .to.be.equal(projectObj.getUserRef());
    expect(result)
      .to.have.property("accessKeyId")
      .to.be.equal(projectObj.getAccessKeyId());
    expect(result)
      .to.have.property("accessKeySecret")
      .to.be.equal(projectObj.getAccessKeySecret());
    expect(result)
      .to.have.property("allowExperiments")
      .to.be.equal(projectObj.getAllowExperiments());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should get a project", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        getProject: () => {
          return {
            sendMessage: () => Promise.resolve(projectObj)
          };
        }
      });

    const ref = "Nx05y-ldZa";
    const projectsAPI = new Projects();
    const result = await projectsAPI.getProject(ref);

    expect(result).to.have.property("ref").to.be.equal(projectObj.getRef());
    expect(result).to.have.property("name").to.be.equal(projectObj.getName());
    expect(result)
      .to.have.property("userRef")
      .to.be.equal(projectObj.getUserRef());
    expect(result)
      .to.have.property("accessKeyId")
      .to.be.equal(projectObj.getAccessKeyId());
    expect(result)
      .to.have.property("accessKeySecret")
      .to.be.equal(projectObj.getAccessKeySecret());
    expect(result)
      .to.have.property("allowExperiments")
      .to.be.equal(projectObj.getAllowExperiments());
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
    expect(serviceStub).to.have.been.calledTwice;
  });

  it("should delete a project", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        deleteProject: () => {
          return {
            sendMessage: () => Promise.resolve({ref: "Nx05y-ldZa"})
          };
        }
      });

    const projectsAPI = new Projects();
    const res = await projectsAPI.deleteProject(projectObj.getRef());

    expect(serviceStub).to.have.been.calledTwice;
    expect(res).to.have.property("ref").to.be.equal(projectObj.getRef());
  });

  it("should update a project", async () => {
    const request = {
      ref: projectObj.getRef(),
      name: "p1",
      allowExperiments: projectObj.getAllowExperiments()
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    const updateProjectStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        updateProject: () => {
          return {
            sendMessage: () =>
              Promise.resolve({getRef: () => projectObj.getRef()})
          };
        }
      });

    const projectsAPI = new Projects();
    const result = await projectsAPI.updateProject(request);
    expect(result).to.have.property("ref").to.be.equal(projectObj.getRef());
    expect(updateProjectStub).to.be.calledTwice;
  });

  it("should renew a project's token", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const loginProjectStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        renewAccessKeySecret: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getAccessKeyId: () => projectObj.getAccessKeyId(),
                getAccessKeySecret: () => "..."
              })
          };
        }
      });

    const request = {
      ref: projectObj.getRef()
    };

    const projectsAPI = new Projects();
    const result = await projectsAPI.renewAccessKeySecret(request);
    expect(result).to.have.property("accessKeySecret").to.be.equal("...");
    expect(loginProjectStub).to.be.calledTwice;
  });
});
