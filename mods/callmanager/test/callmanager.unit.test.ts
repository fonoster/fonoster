import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { APIClient } from "@fonoster/common";
import CallManager from "../src/client/callmanager";
import CallManagerPB from "../src/service/protos/callmanager_pb";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/callmanager", () => {
  afterEach(() => sandbox.restore());

  it("checks the requests parameters", async () => {
    const setFromStub = sandbox.stub(
      CallManagerPB.CallRequest.prototype,
      "setFrom"
    );
    const setToStub = sandbox.stub(
      CallManagerPB.CallRequest.prototype,
      "setTo"
    );
    const setWebhookStub = sandbox.stub(
      CallManagerPB.CallRequest.prototype,
      "setWebhook"
    );

    const initStub = sandbox.stub(APIClient.prototype, "init").returns();
    const serviceStub = sandbox
      .stub(APIClient.prototype, "getService")
      .returns({
        call: () => {
          return {
            sendMessage: () =>
              Promise.resolve({
                getRef: () => "ramdonref"
              })
          };
        }
      });

    const callStub = sandbox.spy(CallManager.prototype, "call");
    const callManager = new CallManager();
    const result = await callManager.call({
      from: "9102104343",
      to: "17853178070",
      webhook: "http://voiceaps.acme.com/myvoiceapp"
    });

    expect(setFromStub).to.be.calledOnceWith("9102104343");
    expect(setToStub).to.be.calledOnceWith("17853178070");
    expect(setWebhookStub).to.be.calledOnceWith(
      "http://voiceaps.acme.com/myvoiceapp"
    );
    expect(initStub).to.be.calledOnce;
    // Once in the constructor and one in the call function
    expect(serviceStub).to.be.calledTwice;
    expect(callStub).to.be.calledOnce;
    expect(result).to.have.property("ref").not.to.be.null;
  });
});
