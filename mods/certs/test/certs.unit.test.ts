import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import createConfigFile from "../src/certs";
import jwt from "jsonwebtoken";
import fs from "fs";
import { join } from "path";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: join(__dirname, "..", "..", ".env") });
}

describe("@fonoster/certs", () => {
  afterEach(() => sandbox.restore());

  it("creates an salt if it does not exist", async () => {
    const existsSync = sandbox.stub(fs, "existsSync").returns(false);
    const writeFileSync = sandbox.stub(fs, "writeFileSync");
    const readFileSync = sandbox
      .stub(fs, "readFileSync")
      .returns("secret salt");
    const sign = sandbox.spy(jwt, "sign");
    const result = await createConfigFile();

    expect(result).to.have.property("accessKeyId").to.be.equal("fonoster");
    expect(result).to.have.property("accessKeySecret").to.be.not.null;
    expect(existsSync).to.have.been.calledOnce;
    expect(sign).to.have.been.calledOnce;
    expect(writeFileSync).to.have.been.calledTwice;
    expect(readFileSync).to.have.been.calledOnce;
  });
});
