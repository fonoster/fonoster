import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import UserManager from "../src/client/usermanager";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/usermanager", () => {
  afterEach(() => sandbox.restore());

  it.skip("needs testing", async () => {
    const userManager = new UserManager();
    await userManager.createUser({
      firstName: "test",
      lastName: "test",
      email: "testing@gmail.com"
    });
  });
});
