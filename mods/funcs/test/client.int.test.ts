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
import logger from "@fonos/logger";
import {DeployStream} from "../src/service/protos/funcs_pb";

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

  it("should deploy a function", async () => {
    const request: DeployFuncRequest = {
      path: __dirname + "/../etc/example",
      name: "test",
      schedule: "0 0 */1 * *"
    };

    const funcs = new Funcs();
    const stream = await funcs.deployFunc(request);

    await new Promise<void>((resolve, reject) => {
      stream.onMessage((msg: string) => {
        logger.info(msg);
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

  it.only("should deploy a function(then/catch)", (done) => {
    const request: DeployFuncRequest = {
      path: __dirname + "/../etc/example",
      name: "test",
      schedule: "0 0 */1 * *"
    };

    const funcs = new Funcs();
    funcs.deployFunc(request).then((stream) => {
      stream.onMessage((msg: string) => {
        logger.info(msg);
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
