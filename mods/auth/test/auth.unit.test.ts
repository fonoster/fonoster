import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {join} from "path";
import AuthUtils, {TokenResponse, UserToken} from "../src/utils/auth_utils";
import Jwt from "../src/utils/jwt";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({path: join(__dirname, "..", "..", "..", ".env")});
}

describe("@fonos/authentication", () => {
  let tokenManager;

  before(async () => {
    // This will create the bucket if it does not exist
    tokenManager = sinon.spy();
    sandbox.stub(Jwt);
  });

  it("should create a valid token", async () => {
    const stubValue = "tokenfake";
    const jwtDependency = new Jwt();
    const authUtils = new AuthUtils(jwtDependency);
    const parameter = {
      accessKeyIdPayload: "userId",
      issuePayload: "issue",
      rolePayload: "role",
      privateKey: "privatekey"
    };
    const stub = sinon.stub(jwtDependency, "encode").resolves(stubValue);

    const expectedValue = {
      accessToken: stubValue
    };

    const token = await authUtils.createToken(
      parameter.accessKeyIdPayload,
      parameter.issuePayload,
      parameter.rolePayload,
      "privatekey"
    );
    expect(stub.calledOnce).to.be.true;
    expect(token.accessToken).to.be.equal(stubValue);
  });

  it("should return a decode jwt", async () => {
    const stubValue = {
      iss: "iss",
      role: "role",
      accessKeyId: "userid"
    };
    const jwtDependency = new Jwt();
    const authUtils = new AuthUtils(jwtDependency);
    const parameter = {
      accessToken: "token"
    };
    const stub = sinon.stub(jwtDependency, "decode").resolves(stubValue);

    const token = await authUtils.validateToken(parameter, "privatekey");
    expect(stub.calledOnce).to.be.true;
    expect(token.data).to.be.equal(stubValue);
  });

  it("should generate a jwt", async () => {
    const stubValue = {
      iss: "iss",
      role: "role",
      accessKeyId: "userid"
    };
    const jwtDependency = new Jwt();
    const token = jwtDependency.encode(stubValue, "secret");
    expect(token).to.be.not.null;
  });

  it("should return an exception with no privatekey", async () => {
    const stubValue = {
      iss: "iss",
      role: "role",
      accessKeyId: "userid"
    };
    const jwtDependency = new Jwt();
    jwtDependency.encode(stubValue, "").catch((err) => {
      expect(err.message).to.be.equal("Token generation failure");
    });
  });

  it("should decode a token", async () => {
    const stubValue = {
      iss: "iss",
      role: "role",
      accessKeyId: "userid"
    };
    const jwtDependency = new Jwt();
    const token = "";
    jwtDependency.encode(stubValue, "secret").then((result) => {
      const docode = jwtDependency
        .decode(result, "secret")
        .then((objectJWT) => {
          expect(objectJWT.accessKeyId).to.be.equal(stubValue.accessKeyId);
        });
    });
  });
});
