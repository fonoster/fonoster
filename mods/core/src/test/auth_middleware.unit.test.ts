import chai from "chai";
import sinon, { stub } from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import roleHasAccess from "../server/usermanager/role_has_access";
import RoleController from "../server/usermanager/src/operations/role_operations";
import Role from "../server/usermanager/src/models/role";
import auth_middleware from "../common/auth/auth_middleware";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/core/commom", () => {
  afterEach(() => sandbox.restore());

  it("checks by middleware if token is valid", async () => {
    const middleware = new auth_middleware("secret");
    const ctx = sinon.stub();
    const next = sinon.stub();
    const erroCb = sinon.stub();
    middleware.middleware(ctx, next, erroCb);

    expect(next.calledOnce);
  });
});
