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
import chaiAsPromised from "chai-as-promised";
import Funcs from "../src/client/funcs";
import {DeployFuncRequest} from "../src/types";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@Fonos/funcs/client", () => {
  afterEach(() => sandbox.restore());

  it("should fail because path doesn't exist a function", async () => {
    const request: DeployFuncRequest = {
      name: "function1",
      baseImage: "fonoster/base:latest",
      pathToFunc: __dirname + "/../etc/testfunc1"
    };

    const funcs = new Funcs();
    expect(funcs.deployFunc(request)).to.eventually.rejectedWith(
      "Unable to obtain function info."
    );
  });

  it.only("should deploy a function", async () => {
    const request: DeployFuncRequest = {
      name: "function1",
      baseImage: "fonoster/base:latest",
      pathToFunc: __dirname + "/../etc/testfunc"
    };
    const funcs = new Funcs();
    const result = await funcs.deployFunc(request);
    expect(result).to.have.property("name").to.be.equal(request.name);
  });
});
