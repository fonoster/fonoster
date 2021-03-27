import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import roleHasAccess from "../server/usermanager/role_has_access";
import RoleController from "../server/usermanager/src/operations/role_operations";
import Role from "../server/usermanager/src/models/role";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/core/usermanager", () => {
  afterEach(() => sandbox.restore());

  it("checks if a role has access to a service", async () => {
    const role1 = new Role({ role: "GUEST", description: "", access: ["a"] });
    const role2 = new Role({
      role: "USER",
      description: "",
      access: ["a", "b"]
    });
    const role3 = new Role({
      role: "ADMIN",
      description: "",
      access: ["a", "b", "c"]
    });
    const roleStub = sandbox
      .stub(RoleController.prototype, "getRoles")
      .returns(Promise.resolve([role1, role2, role3]));
    const hasAccess = await roleHasAccess("USER", "a");
    expect(hasAccess).to.be.equal(true);
    expect(roleStub).to.have.been.calledOnce;
  });

  it("fails with role not having access", async () => {
    const role = new Role({ role: "GUEST", description: "", access: ["a"] });
    const roleStub = sandbox
      .stub(RoleController.prototype, "getRoles")
      .returns(Promise.resolve([]));
    const hasAccess = await roleHasAccess("GUEST", "b");
    expect(roleStub).to.has.been.calledOnce;
    expect(hasAccess).to.be.equal(false);
  });
});
