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
import Funcs, { buildDeployFuncRequest, FuncsPB } from "../src/client/funcs";
import { DeployFuncRequest } from "../src/client/types";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const funcObj = new FuncsPB.Func();
funcObj.setName("fn001");
funcObj.setImage("docker.io/functions/fn001");
funcObj.setAvailableReplicas(1);
funcObj.setReplicas(1);
funcObj.setInvocationCount(1000);
funcObj.setSchedule("* * * * *");

describe("@fonoster/funcs/client", () => {
  afterEach(() => sandbox.restore());

  it("returns a function object a DeployFuncRequest", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const request: DeployFuncRequest = {
      name: "function1",
      path: "...",
      schedule: "0 0 */1 * *",
      limits: {
        memory: "10Mi",
        cpu: "110m"
      },
      requests: {
        memory: "5Mi",
        cpu: "100m"
      }
    };
    const func = buildDeployFuncRequest(request);

    expect(func.getName()).to.be.equal(request.name);
    expect(func.getSchedule()).to.be.equal(request.schedule);
    expect(func.getLimits().getMemory()).to.be.equal(request.limits.memory);
    expect(func.getLimits().getCpu()).to.be.equal(request.limits.cpu);
    expect(func.getRequests().getMemory()).to.be.equal(request.requests.memory);
    expect(func.getRequests().getCpu()).to.be.equal(request.requests.cpu);
  });

  it("should get a function by name", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getFunc: (req, meta, callback) => {
        callback(null, funcObj);
      }
    });

    const funcs = new Funcs();
    const result = await funcs.getFunc({ name: funcObj.getName() });
    expect(result).to.have.property("name").to.be.equal(funcObj.getName());
    expect(result).to.have.property("image").to.be.equal(funcObj.getImage());
    expect(result)
      .to.have.property("invocationCount")
      .to.be.equal(funcObj.getInvocationCount());
    expect(result)
      .to.have.property("replicas")
      .to.be.equal(funcObj.getReplicas());
    expect(result)
      .to.have.property("schedule")
      .to.be.equal(funcObj.getSchedule());
    expect(result)
      .to.have.property("availableReplicas")
      .to.be.equal(funcObj.getAvailableReplicas());
  });

  it("should delete a function", async () => {
    const response = {
      name: funcObj.getName()
    };
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubFunc = sandbox.stub(APIClient.prototype, "getService").returns({
      deleteFunc: (req, meta, callback) => {
        callback(null, response);
      }
    });

    const funcs = new Funcs();
    const result = await funcs.deleteFunc({ name: funcObj.getName() });

    expect(stubFunc).to.be.calledTwice;
    expect(result).to.have.property("name").to.be.equal(response.name);
  });

  it("should get a list of functions", async () => {
    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    const stubFunc = sandbox.stub(APIClient.prototype, "getService").returns({
      listFuncs: (req, meta, callback) => {
        callback(null, {
          getNextPageToken: () => {
            return "1";
          },
          getFuncsList: () => [funcObj]
        });
      }
    });

    const funcs = new Funcs();
    const result = await funcs.listFuncs(request);
    expect(stubFunc).to.be.calledTwice;
    expect(result)
      .to.have.property("nextPageToken")
      .to.be.equal(request.pageToken);
    expect(result.funcs[0])
      .to.have.property("name")
      .to.be.equal(funcObj.getName());
    expect(result.funcs[0])
      .to.have.property("invocationCount")
      .to.be.equal(funcObj.getInvocationCount());
    expect(result.funcs[0])
      .to.have.property("replicas")
      .to.be.equal(funcObj.getReplicas());
    expect(result.funcs[0])
      .to.have.property("availableReplicas")
      .to.be.equal(funcObj.getAvailableReplicas());
  });
});
