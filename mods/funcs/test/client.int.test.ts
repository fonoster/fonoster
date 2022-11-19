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
import Funcs from "../src/client/funcs";
import { DeployFuncRequest, GetFuncRequest } from "../src/client/types";
import logger from "@fonoster/logger";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/funcs/client", () => {
  afterEach(() => sandbox.restore());

  it("should fail because path doesn't exist a function", async () => {
    const request: DeployFuncRequest = {
      name: "function1",
      path: __dirname + "/../etc/testfunc1"
    };

    const funcs = new Funcs();
    expect(funcs.deployFunc(request)).to.eventually.rejectedWith(
      "Unable to obtain function info."
    );
  });

  it("should deploy a function and set a schedule", (done) => {
    const request: DeployFuncRequest = {
      path: __dirname + "/../etc/example",
      name: "get_intent",
      schedule: "0 0 */1 * *"
    };

    const funcs = new Funcs();
    funcs.deployFunc(request).then((stream) => {
      stream.onMessage((msg) => {
        logger.info(msg.text);
      });
      stream.onFinish(() => {
        logger.info("end");
        done();
      });
      stream.onError((e: Error) => {
        logger.error("end");
        done(e);
      });
    });
  });

  it("should get a function by name", async () => {
    const request: GetFuncRequest = {
      name: "get_intent"
    };
    const funcs = new Funcs();
    const result = await funcs.getFunc(request);
    expect(result).to.have.property("name").to.be.equal("get_intent");
  });

  it("will retrive a list of logs", (done) => {
    const request = {
      name: "get_intent",
      tail: 10,
      follow: true,
      since: ""
    };

    const funcs = new Funcs();

    funcs.getFuncLogs(request).then((stream) => {
      stream.onMessage((msg) => {
        logger.info(msg.text);
      });
      stream.onFinish(() => {
        logger.info("end");
        done();
      });
      stream.onError((e: Error) => {
        logger.error("end");
        done(e);
      });
    });
    // For now test by observation :(
  });
});
