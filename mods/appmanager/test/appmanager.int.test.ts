import updateBucketPolicy from "@fonos/core/dist/common/fsutils";
import AppManager from "../src/appmanager";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {join} from "path";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({path: join(__dirname, "..", "..", "..", ".env")});
}

describe("AppManager Service", () => {
  let appmanager: AppManager;

  before(async () => {
    // This will create the bucket if it does not exist
    await updateBucketPolicy("apps");

    appmanager = new AppManager({
      endpoint: `${process.env.APISERVER_ENDPOINT}`,
      bucket: "apps"
    });
  });

  it("fails to create app because bad dir path", () => {
    const path = __dirname + "/../etc/hello-money";
    expect(appmanager.deployApp(path)).to.be.rejectedWith(
      "Unable to obtain project info"
    );
  });

  it("list apps", async () => {
    const result = await appmanager.listApps({
      pageSize: 10,
      pageToken: "0",
      view: 0
    });
    expect(result.getAppsList().length).to.be.greaterThan(0);
  });

  it("gets app by name", async () => {
    const app = await appmanager.getApp("hello-monkeys");
    expect(app.getName()).to.be.equals("hello-monkeys");
  });

  it("fails because app is no yet register", () => {
    expect(appmanager.getApp("hello-money")).to.eventually.rejectedWith(
      "does not exist"
    );
  });

  it("checks delete app", async () => {
    expect(appmanager.deleteApp("hello-monkeys")).to.fulfilled;
    expect(appmanager.getApp("hello-money")).to.eventually.rejectedWith(
      "does not exist"
    );
  });

  it("fails to delete because app does not exist", async () => {
    expect(appmanager.deleteApp("hello-money")).to.eventually.rejectedWith(
      "does not exist"
    );
  });
});
