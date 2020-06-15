import grpc from 'grpc'
import listNumbers from './list_numbers'
import createNumber from './create_number'
import getNumber from './get_number'
import deleteNumber from './delete_number'
import updateNumber from './update_number'
import getIngressApp from './get_ingress_app'
import {
  Number,
  ListNumbersRequest,
  ListNumbersResponse,
  GetNumberRequest,
  CreateNumberRequest,
  UpdateNumberRequest,
  DeleteNumberRequest,
  GetIngressAppRequest
} from '../protos/numbers_pb'
import { Empty } from '../protos/common_pb'
import {
  INumbersService,
  NumbersService,
  INumbersServer
} from '../protos/numbers_grpc_pb'
import { App } from '../protos/appmanager_pb'

class NumbersServer implements INumbersServer {
  async listNumbers (
    call: grpc.ServerUnaryCall<ListNumbersRequest>,
    callback: grpc.sendUnaryData<ListNumbersResponse>
  ) {
    listNumbers(call, callback)
  }

  async createNumber (
    call: grpc.ServerUnaryCall<CreateNumberRequest>,
    callback: grpc.sendUnaryData<Number>
  ) {
    createNumber(call, callback)
  }

  async updateNumber (
    call: grpc.ServerUnaryCall<UpdateNumberRequest>,
    callback: grpc.sendUnaryData<Number>
  ) {
    updateNumber(call, callback)
  }

  async getIngressApp (
    call: grpc.ServerUnaryCall<GetIngressAppRequest>,
    callback: grpc.sendUnaryData<App>
  ) {
    getIngressApp(call, callback)
  }

  async getNumber (
    call: grpc.ServerUnaryCall<GetNumberRequest>,
    callback: grpc.sendUnaryData<Number>
  ) {
    getNumber(call, callback)
  }

  async deleteNumber (
    call: grpc.ServerUnaryCall<DeleteNumberRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    deleteNumber(call, callback)
  }
}

export { NumbersServer as default, INumbersService, NumbersService }
