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
import {DeployFuncRequest, GetFuncRequest} from "../src/types";
import logger from "@fonos/logger";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@Fonos/funcs/client", () => {
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

  it("should deploy a function from base image", async () => {
    const request: DeployFuncRequest = {
      name: "myfunc",
      path: __dirname + "/../etc/example"
    };
    const funcs = new Funcs();
    await funcs.deployFunc(request);
    // For now test by observation :(
  });

  it("should get a function by name", async () => {
    const request: GetFuncRequest = {
      name: "pruebaz"
    };
    const funcs = new Funcs();
    const result = await funcs.getFunc(request);
    expect(result).is.not.null;
    // For now test by observation :(
  });

  it.only("should deploy a function", async () => {
    const request: DeployFuncRequest = {
      path: __dirname + "/../etc/example",
      name: "test",
      schedule: "0 0 */1 * *"
    };

    const funcs = new Funcs();
    const stream = await funcs.deployFunc(request);

    await new Promise<void>((resolve, reject) => {
      stream.onMessage((msg) => {
        logger.info(msg.text);
      });
      stream.onFinish(() => {
        resolve();
      });
      stream.onError((e: Error) => {
        reject(e);
      });
    });
    // For now test by observation :(
  });

  it("should deploy a function(then/catch)", (done) => {
    const request: DeployFuncRequest = {
      path: __dirname + "/../etc/example",
      name: "test",
      schedule: "0 0 */1 * *"
    };

    const funcs = new Funcs();
    funcs.deployFunc(request).then((stream) => {
      stream.onMessage((msg) => {
        logger.info(msg.text);
      });
      stream.onFinish(() => {
        logger.verbose("end");
        done();
      });
      stream.onError((e: Error) => {
        logger.error("end");
        done(e);
      });
    });
    // For now test by observation :(
  });

  it("will retrive a list of logs", (done) => {
    const request = {
      name: "fn603693c0afaa1a080000000ctest1",
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
        logger.verbose("end");
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
