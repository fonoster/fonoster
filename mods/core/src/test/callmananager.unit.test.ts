import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import call, {EndpointInfo} from "../server/callmanager/call";
import {CallRequest} from "../server/protos/callmanager_pb";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/core/callmanager", () => {
  afterEach(() => sandbox.restore());

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
  });
});
