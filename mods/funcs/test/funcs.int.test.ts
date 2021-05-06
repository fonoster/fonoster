import Funcs from "../src/client/funcs";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("AppManager Service", () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  before(async () => {});

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  it("needs testing", () => {});
});
