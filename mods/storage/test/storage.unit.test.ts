import Storage from "../src/storage";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import fs, {Stats} from "fs";
import {FonosService} from "@fonos/core";
import {utils} from "./../src/utils";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();
import path from "path";
import Fiber from "fibers";

describe("@fonos/storage", () => {
  let storage: Storage;

  before(async () => {
    storage = new Storage();
    sandbox.stub(FonosService.prototype, "init").returns();
  });
  afterEach(() => sandbox.restore());

  it("Should reject because is a directory", () => {
    sandbox.stub(utils, "isDirectory").returns(true);

    expect(
      storage.uploadObject({
        bucket: "apps",
        filename: __dirname + "/../etc/hello-monkeys.tgz"
      })
    ).rejected;
  });

  it("Should upload a file with apps bucket correctly and return an UploadObjectResponse", async () => {
    const objectSize = 15;
    const fileNameReturn = "hello-monkeys.tgz";
    sandbox.stub(utils, "isDirectory").returns(false);
    sandbox.stub(path, "basename").returns(fileNameReturn);
    sandbox
      .stub(fs, "statSync")
      .returns({...Stats.prototype, size: objectSize});
    sandbox.stub(FonosService.prototype, "getService").returns({
      uploadObject: () => {
        return {
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
      }
    });

    const result = await storage.uploadObject({
      bucket: "apps",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });
    expect(result).to.have.property("size").to.be.equal(result.size);
  });

  it("Should upload a file with recordings bucket correctly and return an UploadObjectResponse", async () => {
    const objectSize = 15;
    const fileNameReturn = "hello-monkeys.tgz";
    sandbox.stub(utils, "isDirectory").returns(false);
    sandbox.stub(path, "basename").returns(fileNameReturn);
    sandbox
      .stub(fs, "statSync")
      .returns({...Stats.prototype, size: objectSize});
    sandbox.stub(FonosService.prototype, "getService").returns({
      uploadObject: () => {
        return {
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
      }
    });

    const result = await storage.uploadObject({
      bucket: "recordings",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });
    expect(result).to.have.property("size").to.be.equal(result.size);
  });

  it("Should upload a file with public bucket correctly and return an UploadObjectResponse", async () => {
    const objectSize = 15;
    const fileNameReturn = "hello-monkeys.tgz";
    sandbox.stub(utils, "isDirectory").returns(false);
    sandbox.stub(path, "basename").returns(fileNameReturn);
    sandbox
      .stub(fs, "statSync")
      .returns({...Stats.prototype, size: objectSize});
    sandbox.stub(FonosService.prototype, "getService").returns({
      uploadObject: () => {
        return {
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
      }
    });

    const result = await storage.uploadObject({
      bucket: "public",
      filename: __dirname + "/../etc/hello-monkeys.tgz",
      metadata: [1, 2, 3]
    });
    expect(result).to.have.property("size").to.be.equal(result.size);
  });

  it("Should return a correct UploadObjectResponse", async () => {
    const fileReturn = {
      size: 1
    };
    sandbox
      .stub(Storage.prototype, <any>"uploadObjectInternal")
      .returns(fileReturn.size);
    const result = await storage.uploadObject({
      bucket: "apps",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });
    expect(result).to.have.property("size").to.be.equal(fileReturn.size);
  });

  it("Should get an objectURL", async () => {
    const objectUrlReturn = {
      url:
        "http://api.fonoster.net:9000/public/60368b263e9a7d0800000004/test.txt"
    };
    sandbox
      .stub(Storage.prototype, <any>"getObjectURLInternal")
      .returns(objectUrlReturn.url);

    const result = await storage.getObjectURL({
      bucket: "apps",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });

    expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
  });

  it("Should return an URL with apps bucket from the service", async () => {
    const objectUrlReturn = {
      url: "http://api.fonoster.net:9000/apps/60368b263e9a7d0800000004/test.txt"
    };
    sandbox.stub(FonosService.prototype, "getService").returns({
      getObjectURL: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getUrl: () => objectUrlReturn.url
            })
        };
      }
    });

    const result = await storage.getObjectURL({
      bucket: "apps",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });

    expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
  });

  it("Should return an URL with public bucket from the service", async () => {
    const objectUrlReturn = {
      url:
        "http://api.fonoster.net:9000/public/60368b263e9a7d0800000004/test.txt"
    };
    sandbox.stub(FonosService.prototype, "getService").returns({
      getObjectURL: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getUrl: () => objectUrlReturn.url
            })
        };
      }
    });

    const result = await storage.getObjectURL({
      bucket: "public",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });

    expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
  });

  it("Should return an URL with recordings bucket from the service", async () => {
    const objectUrlReturn = {
      url:
        "http://api.fonoster.net:9000/recordings/60368b263e9a7d0800000004/test.txt"
    };
    sandbox.stub(FonosService.prototype, "getService").returns({
      getObjectURL: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getUrl: () => objectUrlReturn.url
            })
        };
      }
    });

    const result = await storage.getObjectURL({
      bucket: "recordings",
      filename: __dirname + "/../etc/hello-monkeys.tgz"
    });

    expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
  });

  it("Should return an URL with Sync method", async () => {
    const objectUrlReturn = {
      url:
        "http://api.fonoster.net:9000/recordings/60368b263e9a7d0800000004/test.txt"
    };
    sandbox.stub(FonosService.prototype, "getService").returns({
      getObjectURL: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getUrl: () => objectUrlReturn.url
            })
        };
      }
    });
    Fiber(() => {
      const result = storage.getObjectURLSync({
        bucket: "recordings",
        filename: __dirname + "/../etc/hello-monkeys.tgz"
      });
      expect(result).to.have.property("url").to.be.equal(objectUrlReturn.url);
    }).run();
  });
});
