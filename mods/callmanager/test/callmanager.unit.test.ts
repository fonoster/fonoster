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
  /*

  it("checks all parameters", async () => {
    const callInfo: EndpointInfo = {
      domain: "test.com",
      context: "test",
      extension: "test",
      trunk: "test"
    };

    const channel = {
      originate: async () => {}
    };

    const request1 = new CallRequest();
    request1.setFrom("");
    request1.setTo("");
    request1.setApp("");

    const request2 = new CallRequest();
    request2.setFrom("78a3178070");
    request2.setTo("91x3178070");
    request2.setApp("default");

    const request3 = new CallRequest();
    request3.setFrom("7853178070");
    request3.setTo("9193178070");
    request3.setApp("");

    const request4 = new CallRequest();
    request4.setFrom("7853178070");
    request4.setTo("9193178070");
    request4.setApp("default");

    expect(call(request1, channel, callInfo)).to.eventually.be.rejectedWith(
      "invalid e164 number"
    );
    expect(call(request2, channel, callInfo)).to.eventually.be.rejectedWith(
      "invalid e164 number"
    );
    expect(call(request3, channel, callInfo)).to.eventually.be.rejectedWith(
      "invalid app reference"
    );
    expect(call(request4, channel, callInfo)).to.eventually.be.fulfilled;
  });

  it("calls a number", async () => {
    const callInfo: EndpointInfo = {
      domain: "acme.com",
      context: "context",
      extension: "extension",
      trunk: "trunk"
    };

    const channel = {
      originate: async (r: any) => {
        expect(r.context).to.be.equal("context");
        expect(r.extension).to.be.equal("extension");
        expect(r.endpoint).to.be.equal(`PJSIP/trunk/sip:17853178070@acme.com`);
        expect(r.variables["DID_INFO"]).to.be.equal("+19193178070");
      }
    };
    const channelStub = sandbox.spy(channel, "originate");

    const request = new CallRequest();
    request.setFrom("9193178070");
    request.setTo("7853178070");
    request.setApp("default");

    const response = await call(request, channel, callInfo);

    expect(response.getFrom()).to.be.equal("+19193178070");
    expect(response.getTo()).to.be.equal("+17853178070");
    expect(response.getApp()).to.be.equal("default");
    expect(channelStub).to.have.been.calledOnce;
  });*/
});
