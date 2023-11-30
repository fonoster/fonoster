import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import AuthUtils from "../src/utils/auth_utils";
import Jwt from "../src/utils/jwt";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/authentication", () => {
  before(async () => {
    sandbox.stub(Jwt);
  });
  const expiredToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpc3MiLCJyb2xlIjoicm9sZSIsImFjY2Vzc0tleUlkIjoidXNlcmlkIiwiaWF0IjoxNjIzMjY1NDQxLCJleHAiOjE2MjMyNjU0NDJ9.2o_T4VgEekNCX3ATir6W_J24fduTXaRSks6zjs2-qBk";

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

  it("should return an exception with jwt expired", async () => {
    const jwtDependency = new Jwt();
    await jwtDependency.decode(expiredToken, "secret").catch((err) => {
      expect(err.message).to.include("jwt expired");
    });
  });

  it("should decode a token", async () => {
    const stubValue = {
      iss: "iss",
      role: "role",
      accessKeyId: "userid"
    };
    const jwtDependency = new Jwt();
    jwtDependency.encode(stubValue, "secret").then((result) => {
      jwtDependency.decode(result, "secret").then((objectJWT) => {
        expect(objectJWT.accessKeyId).to.be.equal(stubValue.accessKeyId);
      });
    });
  });
});
