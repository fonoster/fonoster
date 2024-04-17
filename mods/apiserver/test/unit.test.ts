import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[notifications/builders]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("it needs a test", function () {
    expect(true).to.be.true;
  })
});
