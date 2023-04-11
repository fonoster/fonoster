import chai from "chai";
import sinonChai from "sinon-chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { NumbersPB } from "../../src/client/numbers";
import NumbersServer from "../../src/service/numbers";
import NumberPB, {
  CreateNumberRequest
} from "../../src/service/protos/numbers_pb";
import grpc from "@grpc/grpc-js";
import RoutrClient from "@fonoster/core/dist/common/routr_client";
import exp from "constants";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/service/number", () => {
  afterEach(() => sandbox.restore());

  it("correct E164 Number", async () => {
    const numberList = [
      "16471234567",
      "+16471234567",
      "+1(817) 569-8900",
      "(817) 569-8900"
    ];

    sandbox.stub(RoutrClient.prototype, "connect").returns({});
    sandbox.stub(RoutrClient.prototype, "resourceType").returns({
      create: () => Promise.resolve({}),
      get: () =>
        Promise.resolve({
          metadata: {
            ref: "ref1",
            gwRef: "gwRef1",
            createdOn: "2022-12-20 13:56",
            modifiedOn: "2022-12-20 13:56"
          }
        })
    });

    for (let n of numberList) {
      const createNumberRequest = new CreateNumberRequest();
      createNumberRequest.setE164Number(n);
      createNumberRequest.setAorLink("sip:john@sip.local");
      const call = {
        request: createNumberRequest,
        metadata: {
          internalRepr: new Map<string, string>([["access_key_id", "value1"]])
        }
      } as unknown as grpc.ServerUnaryCall<
        CreateNumberRequest,
        NumberPB.Number
      >;
      const numberServer = new NumbersServer();
      let result = {} as NumbersPB.Number;
      let error = {};
      await numberServer.createNumber(call, (e, r) => {
        result = r;
        error = e;
      });

      expect(error).to.be.null;
      expect(result.getRef()).to.be.eq("ref1");
    }
  });

  it("incorrect E164 Number", async () => {
    const numberList = ["1647123456712345234523453"];

    sandbox.stub(RoutrClient.prototype, "connect").returns({});
    sandbox.stub(RoutrClient.prototype, "resourceType").returns({
      create: () => Promise.resolve({}),
      get: () =>
        Promise.resolve({
          metadata: {
            ref: "ref1",
            gwRef: "gwRef1",
            createdOn: "2022-12-20 13:56",
            modifiedOn: "2022-12-20 13:56"
          }
        })
    });

    for (let n of numberList) {
      const createNumberRequest = new CreateNumberRequest();
      createNumberRequest.setE164Number(n);
      createNumberRequest.setAorLink("sip:john@sip.local");
      const call = {
        request: createNumberRequest,
        metadata: {
          internalRepr: new Map<string, string>([["access_key_id", "value1"]])
        }
      } as unknown as grpc.ServerUnaryCall<
        CreateNumberRequest,
        NumberPB.Number
      >;
      const numberServer = new NumbersServer();
      let result = {} as NumbersPB.Number;
      let error = {};
      await numberServer.createNumber(call, (e, r) => {
        result = r;
        error = e;
      });
      expect(result).to.be.null;
      expect(error)
        .to.have.property("name")
        .to.be.equal("FonosInvalidArgument");
      expect(error)
        .to.have.property("message")
        .to.be.equal("e164Number field must be a valid e164 value.");
    }
  });
});
