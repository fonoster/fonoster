import Numbers from "../src/client/numbers";
import chai from "chai";
import sinonChai from "sinon-chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { APIClient } from "@fonoster/common";
import { NumbersPB } from "../src/client/numbers";
import { CreateNumberResponse } from "../src/client/types";
import numberDecoder from "../src/service/decoder";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/number", () => {
  const numberObj = new NumbersPB.Number();
  const ingressInfo = new NumbersPB.IngressInfo();
  ingressInfo.setWebhook("https://webhooks.acme.com/calls");
  ingressInfo.setAccessKeyId("603693c0afaa1a080000000c");
  numberObj.setRef("cb8V0CNTfH");
  numberObj.setE164Number("16471234567");
  numberObj.setAorLink("sip:john@sip.local");
  numberObj.setProviderRef("Nx05y-ldZa");
  numberObj.setIngressInfo(ingressInfo);
  numberObj.setUpdateTime("...");
  numberObj.setCreateTime("...");

  const numberPlain = {
    ref: numberObj.getRef(),
    e164Number: numberObj.getE164Number(),
    aorLink: numberObj.getAorLink(),
    metadata: {
      webhook: numberObj.getIngressInfo()?.getWebhook(),
      appRef: numberObj.getIngressInfo()?.getAppRef()
    },
    providerRef: numberObj.getProviderRef()
  };

  afterEach(() => sandbox.restore());

  it("should create a number", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubNumber = sandbox.stub(APIClient.prototype, "getService").returns({
      createNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberObj)
        };
      }
    });

    const numbers = new Numbers();
    const result: CreateNumberResponse = await numbers.createNumber({
      e164Number: numberPlain.e164Number,
      providerRef: numberPlain.providerRef
    });

    expect(stubNumber).to.be.calledTwice;
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
  });

  it("should get a number by ref", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberObj)
        };
      }
    });

    const numbers = new Numbers();
    const result = await numbers.getNumber(numberPlain.ref);
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
    expect(result)
      .to.have.property("e164Number")
      .to.be.equal(numberPlain.e164Number);
    expect(result).to.have.property("aorLink").to.be.equal(numberPlain.aorLink);
    expect(result)
      .to.have.property("ingressInfo")
      .to.have.property("webhook")
      .to.be.equal(numberPlain.metadata.webhook);
    expect(result)
      .to.have.property("ingressInfo")
      .to.have.property("appRef")
      .to.be.equal(numberPlain.metadata.appRef);
    expect(result)
      .to.have.property("providerRef")
      .to.be.equal(numberPlain.providerRef);
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
  });

  it("should delete a number", async () => {
    const refReturn = {
      ref: numberPlain.ref
    };
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubNumber = sandbox.stub(APIClient.prototype, "getService").returns({
      deleteNumber: () => {
        return {
          sendMessage: () => Promise.resolve(refReturn)
        };
      }
    });

    const numbers = new Numbers();
    const result = await numbers.deleteNumber(numberPlain.ref);

    expect(stubNumber).to.be.calledTwice;
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
  });

  it("should get a number list", async () => {
    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    const stubNumber = sandbox.stub(APIClient.prototype, "getService").returns({
      listNumbers: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getNextPageToken: () => {
                return "1";
              },
              getNumbersList: () => [numberObj]
            })
        };
      }
    });

    const numbers = new Numbers();
    const result = await numbers.listNumbers(request);
    expect(stubNumber).to.be.calledTwice;
    expect(result)
      .to.have.property("nextPageToken")
      .to.be.equal(request.pageToken);
    expect(result.numbers[0])
      .to.have.property("ref")
      .to.be.equal(numberPlain.ref);
    expect(result.numbers[0])
      .to.have.property("e164Number")
      .to.be.equal(numberPlain.e164Number);
    expect(result.numbers[0])
      .to.have.property("aorLink")
      .to.be.equal(numberPlain.aorLink);
    expect(result.numbers[0])
      .to.have.property("providerRef")
      .to.be.equal(numberPlain.providerRef);
    expect(result.numbers[0]).to.have.property("createTime").not.to.be.null;
    expect(result.numbers[0]).to.have.property("updateTime").not.to.be.null;
  });

  it("Should return error with aorLink and ingressInfo", async () => {
    const request = {
      ref: numberPlain.ref,
      aorLink: numberPlain.aorLink,
      metadata: {
        webhook: numberPlain.metadata.webhook
      }
    };

    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberObj)
        };
      }
    });

    const numbers = new Numbers();
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith(
      "are not compatible parameters"
    );
  });

  it("Should return error with no aorLink and ingressInfo", async () => {
    const request = {
      ref: numberPlain.ref
    };
    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberObj)
        };
      }
    });

    const numbers = new Numbers();
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith(
      "You must provider either"
    );
  });

  it("Should udpdate a number with aorLink", async () => {
    const request = {
      ref: numberPlain.ref,
      aorLink: numberPlain.aorLink
    };
    sandbox.stub(APIClient.prototype, "init").returns();
    const returnNumberDb = new NumbersPB.Number();
    returnNumberDb.setRef(request.ref);
    sandbox.stub(APIClient.prototype, "getService").returns({
      updateNumber: () => {
        return {
          sendMessage: () => Promise.resolve(returnNumberDb)
        };
      },
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(returnNumberDb)
        };
      }
    });

    const numbers = new Numbers();
    const result = await numbers.updateNumber(request);

    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
  });

  it("Should udpdate a number with ingressInfo", async () => {
    const request = {
      ref: numberPlain.ref,
      ingressInfo: {
        webhook: numberPlain.metadata.webhook
      }
    };
    const returnNumberDb = new NumbersPB.Number();
    returnNumberDb.setRef(request.ref);

    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      updateNumber: () => {
        return {
          sendMessage: () => Promise.resolve(returnNumberDb)
        };
      },
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(returnNumberDb)
        };
      }
    });

    const numbers = new Numbers();
    const result = await numbers.updateNumber(request);
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
  });

  it("Should return the ingress info for a number", async () => {
    const returnIngressInfo = new NumbersPB.IngressInfo();
    returnIngressInfo.setWebhook("https://webhooks.acme.com/calls");
    returnIngressInfo.setAppRef("134");

    sandbox.stub(APIClient.prototype, "init").returns();
    sandbox.stub(APIClient.prototype, "getService").returns({
      getIngressInfo: () => {
        return {
          sendMessage: () => Promise.resolve(returnIngressInfo)
        };
      }
    });

    const numbers = new Numbers();
    const result = await numbers.getIngressInfo({ e164Number: "16471234567" });
    expect(result)
      .to.have.property("webhook")
      .to.be.equal(returnIngressInfo.getWebhook());
    expect(result)
      .to.have.property("appRef")
      .to.be.equal(returnIngressInfo.getAppRef());
  });

  context("number decoder", () => {
    let jsonObj;

    beforeEach(() => {
      jsonObj = {
        metadata: {
          ref: "001",
          gwRef: "1001",
          createdOn: "DATE",
          modifiedOn: "DATE",
          webhook: "http://localhost:8080/apps/hello-world"
        },
        spec: {
          location: {
            telUrl: "tel:17853178070"
          }
        }
      };
    });

    it("should create a number object from a json object", () => {
      const number = numberDecoder(jsonObj);
      expect(number.getRef()).to.be.equal(jsonObj.metadata.ref);
      expect(number.getProviderRef()).to.be.equal(jsonObj.metadata.gwRef);
      expect(number.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn);
      expect(number.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn);
      expect(number.getIngressInfo().getWebhook()).to.be.equal(
        jsonObj.metadata.webhook
      );
      expect(number.getE164Number()).to.be.equal(
        jsonObj.spec.location.telUrl.split(":")[1]
      );
    });

    it("should create a number object from without ingress app", () => {
      delete jsonObj.metadata.webhook;
      const number = numberDecoder(jsonObj);
      expect(number.getRef()).to.be.equal(jsonObj.metadata.ref);
      expect(number.getProviderRef()).to.be.equal(jsonObj.metadata.gwRef);
      expect(number.getCreateTime()).to.be.equal(jsonObj.metadata.createdOn);
      expect(number.getUpdateTime()).to.be.equal(jsonObj.metadata.modifiedOn);
      //expect(number.getIngressInfo().getWebhook()).to.be.a("string").lengthOf(0);
      expect(number.getE164Number()).to.be.equal(
        jsonObj.spec.location.telUrl.split(":")[1]
      );
    });
  });
});
