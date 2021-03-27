import updateBucketPolicy from "@fonos/core/dist/common/fsutils";
import Storage from "../src/storage";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { join } from "path";
import Fiber from "fibers";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: join(__dirname, "..", "..", "..", ".env") });
}

describe("Storage Service", () => {
  let storage: Storage;

  before(async () => {
    // This will create the bucket if it does not exist
    await updateBucketPolicy("test");

    storage = new Storage({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    });
  });

  it("Upload object with bad bucket", () => {
    // Will fail because directory does not exist
    expect(
      storage.uploadObject({
        bucket: "apps",
        filename: __dirname + "/../etc/hello-monkeys.tgz"
      })
    ).to.eventually.be.rejectedWith(
      "The specified bucket does not exist -> bucket: apps"
    );
  });

  it("Uploading a directory", () => {
    // Will fail for directories
    expect(
      storage.uploadObject({
        bucket: "public",
        filename: __dirname
      })
    ).to.eventually.be.rejectedWith("is not supported");
  });

  it("Upload a single compress(tar) file", async () => {
    // Will pass
    const result = await storage.uploadObject({
      bucket: "apps",
      filename: __dirname + "/../etc/hello-monkeys.tgz",
      metadata: {
        contentType: "text/html"
      }
    });

    // Asserted this way to prevent issue with size changes
    // different filesystems
    expect(result.size).to.be.greaterThan(0);
  });

  it("Upload a single uncompress file", async () => {
    // Will pass
    const result = await storage.uploadObject({
      bucket: "apps",
      filename: __dirname + "/../etc/test.txt"
    });
    // Asserted this way to prevent issue with size changes
    // different filesystems
    expect(result.size).to.be.greaterThan(0);
  });

  it("fails because url was not found", () => {
    expect(
      storage.getObjectURL({ bucket: "recordings", filename: "test.wav" })
    ).to.eventually.rejectedWith("filename 'test.wav' in dir 'default'");
  });

  it("gets object url", () => {
    const p = storage.getObjectURL({ bucket: "public", filename: "test.txt" });
    expect(p).to.eventually.include("/default/test.txt");
  });

  it("gets object url sync", () => {
    Fiber(() => {
      const url = storage.getObjectURLSync({
        bucket: "public",
        filename: "test.txt"
      });
      expect(url).to.include("test.txt");
    }).run();
  });
});
