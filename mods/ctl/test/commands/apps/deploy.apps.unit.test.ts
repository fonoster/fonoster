import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { App } from "@fonos/core/src/server/protos/appmanager_pb";
import AppManager from "@fonos/appmanager";
import DeployCommand from "../../../src/commands/apps/deploy";
import { cli } from "cli-ux";
const sandbox = sinon.createSandbox();
const expect = chai.expect;
chai.use(sinonChai);

describe("@fonos/ctl/apps", () => {
  let deployAppStub: any;
  let consoleStub: any;
  let actionStub: any;

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    actionStub = sandbox.stub(cli.action, "start");
    const app = new App();
    app.setName("My App");
    app.setDescription("A test application");
    app.setCreateTime("January 01, 1970 00:00:00 UTC.");
    deployAppStub = sandbox
      .stub(AppManager.prototype, "deployApp")
      .returns(Promise.resolve(app));
    consoleStub = sandbox.stub(console, "log");
  });

  it.skip("should deploy app", async () => {
    await DeployCommand.run();
    expect(deployAppStub).to.be.calledOnce;
    expect(actionStub).to.be.calledOnce;
    expect(consoleStub.getCall(0).args[0]).to.contain(
      "Default Bucket: default"
    );
  });
});
