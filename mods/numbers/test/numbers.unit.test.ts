import Numbers from "../src/numbers";
import chai from "chai";
import sinonChai from "sinon-chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import {FonosService, NumbersPB, AppManagerPB} from "@fonos/core";
import {CreateNumberResponse} from "../src/types";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/number", () => {
  const numbers = new Numbers();
  const numberObj = new NumbersPB.Number();
  const numberPlain = {
    ref: "cb8V0CNTfH",
    e164Number: "16471234567",
    aorLink: "sip:john@sip.local",
    ingressApp: "hYTHYCYv_U",
    providerRef: "Nx05y-ldZa"
  };
  numberObj.setRef("cb8V0CNTfH");
  numberObj.setE164Number("16471234567");
  numberObj.setAorLink("sip:john@sip.local");
  numberObj.setProviderRef("Nx05y-ldZa");
  numberObj.setIngressApp("hYTHYCYv_U");
  numberObj.setUpdateTime("...");
  numberObj.setCreateTime("...");
  sandbox.stub(FonosService.prototype, "init").returns();

  before(() => {
    // TODO Create provider and app if doesn't exist
  });

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
  });

  it("should create a number", async () => {
    const stubNumber = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        createNumber: () => {
          return {
            sendMessage: () => Promise.resolve(numberObj)
          };
        }
      });
    const result: CreateNumberResponse = await numbers.createNumber({
      e164Number: numberPlain.e164Number,
      providerRef: numberPlain.providerRef
    });

    expect(stubNumber.calledOnce).to.be.equal(true);
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
    expect(result)
      .to.have.property("e164Number")
      .to.be.equal(numberPlain.e164Number);
    expect(result).to.have.property("aorLink").to.be.equal(numberPlain.aorLink);
    expect(result)
      .to.have.property("providerRef")
      .to.be.equal(numberPlain.providerRef);
  });

  it("should get a number by ref", async () => {
    sandbox.stub(FonosService.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberObj)
        };
      }
    });
    const result = await numbers.getNumber(numberPlain.ref);
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
    expect(result)
      .to.have.property("e164Number")
      .to.be.equal(numberPlain.e164Number);
    expect(result).to.have.property("aorLink").to.be.equal(numberPlain.aorLink);
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
    const stubNumber = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        deleteNumber: () => {
          return {
            sendMessage: () => Promise.resolve(refReturn)
          };
        }
      });
    const result = await numbers.deleteNumber(numberPlain.ref);

    expect(stubNumber.calledOnce).to.be.equal(true);
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
  });

  it("should get a number list", async () => {
    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };

    const stubNumber = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
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

    const result = await numbers.listNumbers(request);
    expect(stubNumber.calledOnce).to.be.equal(true);
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

  it("Should return error with aorLink and ingressApp", async () => {
    const request = {
      ref: numberPlain.ref,
      aorLink: numberPlain.aorLink,
      ingressApp: numberPlain.ingressApp
    };

    sandbox.stub(FonosService.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberObj)
        };
      }
    });
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith(
      "are not compatible parameters"
    );
  });
  it("Should return error with no aorLink and ingressApp", async () => {
    const request = {
      ref: numberPlain.ref
    };
    sandbox.stub(FonosService.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberObj)
        };
      }
    });
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith(
      "You must provider either"
    );
  });
  it("Should udpdate a number with aorLink", async () => {
    const request = {
      ref: numberPlain.ref,
      aorLink: numberPlain.aorLink
    };
    const returnNumberDb = new NumbersPB.Number();
    returnNumberDb.setRef(request.ref);
    sandbox.stub(FonosService.prototype, "getService").returns({
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
    const result = await numbers.updateNumber(request);

    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
  });
  it("Should udpdate a number with ingressApp", async () => {
    const request = {
      ref: numberPlain.ref,
      ingressApp: numberPlain.ingressApp
    };
    const returnNumberDb = new NumbersPB.Number();
    returnNumberDb.setRef(request.ref);

    sandbox.stub(FonosService.prototype, "getService").returns({
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
    const result = await numbers.updateNumber(request);
    expect(result).to.have.property("ref").to.be.equal(numberPlain.ref);
  });

  it("Should return an app", async () => {
    const returnApp = new AppManagerPB.App();
    returnApp.setRef("Nx05y-ldZa");
    returnApp.setName("app");
    returnApp.setAccessKeyId("60368b263e9a7d0800000004");
    returnApp.setDescription("testApp");
    returnApp.setUpdateTime("...");
    returnApp.setCreateTime("...");
    const returnResult = {
      accessKeyId: "60368b263e9a7d0800000004",
      description: "testApp",
      name: "app",
      ref: "Nx05y-ldZa"
    };
    sandbox.stub(FonosService.prototype, "getService").returns({
      getIngressApp: () => {
        return {
          sendMessage: () => Promise.resolve(returnApp)
        };
      }
    });
    const result = await numbers.getIngressApp({e164Number: "16471234567"});
    expect(result).to.have.property("ref").to.be.equal(returnResult.ref);
    expect(result).to.have.property("name").to.be.equal(returnResult.name);
    expect(result)
      .to.have.property("description")
      .to.be.equal(returnResult.description);
    expect(result)
      .to.have.property("accessKeyId")
      .to.be.equal(returnResult.accessKeyId);
    expect(result).to.have.property("createTime").not.to.be.null;
    expect(result).to.have.property("updateTime").not.to.be.null;
  });
});
