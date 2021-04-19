import grpc from "grpc";
import createNumber from "./create_number";
import updateNumber from "./update_number";
import getIngressApp from "./get_ingress_app";
import {
  ListNumbersRequest,
  ListNumbersResponse,
  GetNumberRequest,
  CreateNumberRequest,
  UpdateNumberRequest,
  DeleteNumberRequest,
  GetIngressAppRequest
} from "./protos/numbers_pb";
import NumberPB from "./protos/numbers_pb";
import {Empty} from "./protos/common_pb";
import {
  INumbersService,
  NumbersService,
  INumbersServer
} from "./protos/numbers_grpc_pb";
import {App} from "@fonos/appmanager/src/service/protos/appmanager_pb";
import numberDecoder from "./decoder";
import {Kind, ResourceServer} from "@fonos/core";

class NumbersServer extends ResourceServer implements INumbersServer {
  constructor() {
    // Useless
    super(Kind.NUMBER, numberDecoder);
  }

  async listNumbers(
    call: grpc.ServerUnaryCall<ListNumbersRequest>,
    callback: grpc.sendUnaryData<ListNumbersResponse>
  ) {
    super.listResources(Kind.NUMBER, numberDecoder, call, callback);
  }

  async createNumber(
    call: grpc.ServerUnaryCall<CreateNumberRequest>,
    callback: grpc.sendUnaryData<NumberPB.Number>
  ) {
    try {
      callback(null, await createNumber(call.request.getNumber(), call));
    } catch (e) {
      callback(e, null);
    }
  }

  async updateNumber(
    call: grpc.ServerUnaryCall<UpdateNumberRequest>,
    callback: grpc.sendUnaryData<NumberPB.Number>
  ) {
    updateNumber(call, callback);
  }

  async getIngressApp(
    call: grpc.ServerUnaryCall<GetIngressAppRequest>,
    callback: grpc.sendUnaryData<App>
  ) {
    try {
      callback(null, await getIngressApp(call.request.getE164Number()));
    } catch (e) {
      callback(e, null);
    }
  }

  async getNumber(
    call: grpc.ServerUnaryCall<GetNumberRequest>,
    callback: grpc.sendUnaryData<NumberPB.Number>
  ) {
    super.getResource(Kind.NUMBER, numberDecoder, call, callback);
  }

  async deleteNumber(
    call: grpc.ServerUnaryCall<DeleteNumberRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    super.deleteResource(Kind.NUMBER, numberDecoder, call, callback);
  }
}

export {NumbersServer as default, INumbersService, NumbersService};
