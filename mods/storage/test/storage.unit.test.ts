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
import Storage from "../src/client/storage";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import fs, { Stats } from "fs";
import { APIClient } from "@fonoster/common";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();
import path from "path";
import fiber from "fibers";
import * as utils from "../src/client/utils";

describe("@fonoster/storage", () => {
  const objectUrlReturn = {
    url: "http://api.fonoster.net:9000/recordings/60368b263e9a7d0800000004/test.txt"
  };
  const uploadObjectStubReturn = {
    sendMessage: () =>
      Promise.resolve({
        stream: {
          write() {
            0;
          },
          end() {
            0;
          }
        }
      })
  };

  const getUrlObjectStubReturn = {
    sendMessage: () =>
      Promise.resolve({
        getUrl: () => objectUrlReturn.url
      })
  };
  afterEach(() => sandbox.restore());

  it("should reject because is a directory", () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(utils, "isDirectory").returns(true);
    sandbox.stub(APIClient.prototype, "getService").returns({
      uploadObject: () => {
        return uploadObjectStubReturn;
      }
    });
    const storage = new Storage();

    expect(
      storage.uploadObject({
        bucket: "apps",
        filename: __dirname + "/../etc/hello-monkeys.tgz"
      })
    ).rejected;
  });

  it("should upload a file with apps bucket correctly and return an UploadObjectResponse", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const objectSize = 15;
    const fileNameReturn = "hello-monkeys.tgz";
    sandbox.stub(utils, "isDirectory").returns(false);
    sandbox.stub(path, "basename").returns(fileNameReturn);
    sandbox
      .stub(fs, "statSync")
      .returns({ ...Stats.prototype, size: objectSize });
    sandbox.stub(APIClient.prototype, "getService").returns({
      uploadObject: () => {
        return uploadObjectStubReturn;
      }
    });

    const storage = new Storage();

    const result = await storage.uploadObject({
      bucket: "apps",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });
    expect(result).to.have.property("size").to.be.equal(result.size);
  });

  it("should upload a file with recordings bucket correctly and return an UploadObjectResponse", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const objectSize = 15;
    const fileNameReturn = "hello-monkeys.tgz";
    sandbox.stub(utils, "isDirectory").returns(false);
    sandbox.stub(path, "basename").returns(fileNameReturn);
    sandbox
      .stub(fs, "statSync")
      .returns({ ...Stats.prototype, size: objectSize });
    sandbox.stub(APIClient.prototype, "getService").returns({
      uploadObject: () => {
        return uploadObjectStubReturn;
      }
    });

    const storage = new Storage();

    const result = await storage.uploadObject({
      bucket: "recordings",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });
    expect(result).to.have.property("size").to.be.equal(result.size);
  });

  it("should upload a file with public bucket correctly and return an UploadObjectResponse", async () => {
    const objectSize = 15;
    const fileNameReturn = "hello-monkeys.tgz";

    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(utils, "isDirectory").returns(false);
    sandbox.stub(path, "basename").returns(fileNameReturn);
    sandbox
      .stub(fs, "statSync")
      .returns({ ...Stats.prototype, size: objectSize });
    sandbox.stub(APIClient.prototype, "getService").returns({
      uploadObject: () => {
        return uploadObjectStubReturn;
      }
    });

    const storage = new Storage();
    const result = await storage.uploadObject({
      bucket: "public",
      filename: __dirname + "/../etc/hello-monkeys.tgz",
      metadata: [1, 2, 3]
    });
    expect(result).to.have.property("size").to.be.equal(result.size);
  });

  it("should return an URL with apps bucket from the service", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getObjectURL: (a: any, b: any) => {
        return getUrlObjectStubReturn;
      }
    });

    const storage = new Storage();
    const result = await storage.getObjectURL({
      bucket: "apps",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });

    expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
  });

  it("should return an URL with public bucket from the service", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getObjectURL: () => {
        return getUrlObjectStubReturn;
      }
    });

    const storage = new Storage();
    const result = await storage.getObjectURL({
      bucket: "public",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });

    expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
  });

  it("should return an URL with recordings bucket from the service", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getObjectURL: () => {
        return getUrlObjectStubReturn;
      }
    });

    const storage = new Storage();
    const result = await storage.getObjectURL({
      bucket: "recordings",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });

    expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
  });
});
