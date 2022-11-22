/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import grpc from "@grpc/grpc-js";
import createNumber from "./create_number";
import updateNumber from "./update_number";
import { routr } from "@fonoster/core";
import {
  ListNumbersRequest,
  ListNumbersResponse,
  GetNumberRequest,
  CreateNumberRequest,
  UpdateNumberRequest,
  DeleteNumberRequest,
  GetIngressInfoRequest
} from "./protos/numbers_pb";
import NumberPB from "./protos/numbers_pb";
import { Empty } from "./protos/common_pb";
import {
  INumbersService,
  NumbersService,
  INumbersServer
} from "./protos/numbers_grpc_pb";
import { Kind, ResourceServer } from "@fonoster/core";
import decoder from "./decoder";
import { ErrorCodes, FonosterError } from "@fonoster/errors";

class NumbersServer extends ResourceServer implements INumbersServer {
  [name: string]: grpc.UntypedHandleCall;
  async listNumbers(
    call: grpc.ServerUnaryCall<ListNumbersRequest, ListNumbersResponse>,
    callback: grpc.sendUnaryData<ListNumbersResponse>
  ) {
    const result = await ResourceServer.listResources(Kind.NUMBER, call);
    const response = new ListNumbersResponse();
    if (result && result.resources) {
      const domains = result.resources.map((resource) => decoder(resource));
      response.setNextPageToken(result.nextPageToken + "");
      response.setNumbersList(domains);
    }
    callback(null, response);
  }

  async createNumber(
    call: grpc.ServerUnaryCall<CreateNumberRequest, NumberPB.Number>,
    callback: grpc.sendUnaryData<NumberPB.Number>
  ) {
    try {
      callback(null, await createNumber(call.request, call));
    } catch (e) {
      callback(e, null);
    }
  }

  async updateNumber(
    call: grpc.ServerUnaryCall<UpdateNumberRequest, NumberPB.Number>,
    callback: grpc.sendUnaryData<NumberPB.Number>
  ) {
    updateNumber(call, callback);
  }

  async getIngressInfo(
    call: grpc.ServerUnaryCall<GetIngressInfoRequest, NumberPB.IngressInfo>,
    callback: grpc.sendUnaryData<NumberPB.IngressInfo>
  ) {
    try {
      await routr.connect();
      const result = await routr.getNumber(call.request.getE164Number());
      if (!result) {
        throw new FonosterError("Number not found", ErrorCodes.NOT_FOUND);
      }
      const number = decoder(result);
      callback(null, number.getIngressInfo());
    } catch (e) {
      callback(e, null);
    }
  }

  async getNumber(
    call: grpc.ServerUnaryCall<GetNumberRequest, NumberPB.Number>,
    callback: grpc.sendUnaryData<NumberPB.Number>
  ) {
    try {
      const result = await ResourceServer.getResource(Kind.NUMBER, call);
      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteNumber(
    call: grpc.ServerUnaryCall<DeleteNumberRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await ResourceServer.deleteResource(Kind.NUMBER, call);
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export { NumbersServer as default, INumbersService, NumbersService };
