import Numbers from "../src/numbers";
import chai from "chai";
import sinonChai from "sinon-chai";
import sinon, { assert, fake } from "sinon";

import chaiAsPromised from "chai-as-promised";
import { join } from "path";
import { FonosService, NumbersPB, AppManagerPB } from "@fonos/core";

import { CreateNumberResponse } from "../src/types";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/number", () => {
  let numbers: any;
  const numberObj = new NumbersPB.Number();
  numberObj.setRef("Nx05y-ldZa");
  numberObj.setUpdateTime("...");
  numberObj.setCreateTime("...");
  before(() => {
    numbers = new Numbers();
    // TODO Create provider and app if doesn't exist
  });

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
  });

  it("should create a number", async () => {
    const numberReturn: CreateNumberResponse = {
      aorLink: "test",
      e164Number: "test",
      ingressApp: "test",
      providerRef: "test",
      ref: "test"
    };
    const numberReturnPromise = new NumbersPB.Number();
    numberReturnPromise.setAorLink(numberReturn.aorLink);
    numberReturnPromise.setIngressApp(numberReturn.ingressApp);

    const stubNumber = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        createNumber: () => {
          return {
            sendMessage: () => Promise.resolve(numberReturnPromise)
          };
        }
      });
    const result: CreateNumberResponse = await numbers.createNumber({
      e164Number: "0000000000",
      ingressApp: "default"
    });

    expect(stubNumber.calledOnce).to.be.equal(true);
    expect(numberReturn.aorLink).to.be.equal(result.aorLink);
    expect(numberReturn.ingressApp).to.be.equal(result.ingressApp);
  });

  it("should get a number by ref", async () => {
    const numberReturn: CreateNumberResponse = {
      aorLink: "test",
      e164Number: "test",
      ingressApp: "test",
      providerRef: "test",
      ref: "test"
    };
    const numberReturnPromise = new NumbersPB.Number();
    numberReturnPromise.setAorLink(numberReturn.aorLink);
    numberReturnPromise.setIngressApp(numberReturn.ingressApp);

    const stubNumber = sandbox
      .stub(FonosService.prototype, "getService")
      .returns({
        getNumber: () => {
          return {
            sendMessage: () => Promise.resolve(numberReturnPromise)
          };
        }
      });
    const result = await numbers.getNumber("ref");
    expect(stubNumber.calledOnce).to.be.equal(true);
    expect(numberReturn.aorLink).to.be.equal(result.aorLink);
    expect(numberReturn.ingressApp).to.be.equal(result.ingressApp);
  });

  it("should delete a number", async () => {
    const refReturn = {
      ref: "ref"
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
    const result = await numbers.deleteNumber("ref");

    expect(stubNumber.calledOnce).to.be.equal(true);
    expect(refReturn.ref).to.be.equal(result.ref);
  });

  it("should get a number list", async () => {
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
    const request = {
      pageSize: 0,
      pageToken: "1",
      view: 0
    };
    const result = await numbers.listNumbers(request);
    expect(stubNumber.calledOnce).to.be.equal(true);
    expect(result).to.have.property("nextPageToken").to.be.equal("1");
    expect(result.numbers[0]).to.have.property("ref").to.be.equal("Nx05y-ldZa");
  });

  it("Should return error with aorLink and ingressApp", async () => {
    const request = {
      aorLink: "x",
      ingressApp: "x"
    };

    const numberReturnPromise = new NumbersPB.Number();

    sandbox.stub(FonosService.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: (r: any) => Promise.resolve(numberReturnPromise)
        };
      }
    });
    sandbox.stub(numbers, "getNumber").returns({});
    sinon.spy(numbers, "updateNumber");
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith(
      "are not compatible parameters"
    );
  });
  it("Should return error with no aorLink and ingressApp", async () => {
    const request = {};
    const numberReturnPromise = new NumbersPB.Number();
    sandbox.stub(FonosService.prototype, "getService").returns({
      getNumber: () => {
        return {
          sendMessage: () => Promise.resolve(numberReturnPromise)
        };
      }
    });
    sandbox.stub(numbers, "getNumber").returns({});
    sinon.spy(numbers, "updateNumber");
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith(
      "You must provider either"
    );
  });
  it("Should udpdate a number with aorLink", async () => {
    const request = {
      ref: "x",
      aorLink: "x"
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

    expect(result.ref).to.be.equal(request.ref);
  });
  it("Should udpdate a number with ingressApp", async () => {
    const request = {
      ref: "x",
      ingressApp: "test"
    };
    const returnNumberDb = new NumbersPB.Number();
    returnNumberDb.setRef(request.ref);

    sandbox.stub(numbers, "getNumber").returns(returnNumberDb);
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
    expect(request.ref).to.be.equal(result.ref);
  });

  it("Should return an app", async () => {
    const returnApp = new AppManagerPB.App();
    const returnResult = {
      "accessKeyId": "",
      "createTime": "",
      "description": "",
      "name": "",
      "ref": "",
      "updateTime": ""
    }
    sandbox.stub(FonosService.prototype, "getService").returns({
      getIngressApp: () => {
        return {
          sendMessage: () => Promise.resolve(returnApp)
        };
      }
    });
    const result = await numbers.getIngressApp("ref");
    expect(result.ref).to.be.equal(returnResult.ref);
  });
});
