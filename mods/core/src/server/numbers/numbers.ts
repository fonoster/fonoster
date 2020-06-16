import grpc from 'grpc'
import createNumber from './create_number'
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
import { auth } from '../../common/trust_util'
import { FonosAuthError } from '@fonos/errors'
import getResource from '../resources/get_resource'
import { Kind } from '../../common/resource_encoder'
import numberDecoder from '../../common/decoders/number_decoder'
import deleteResource from '../resources/delete_resource'
import ResourceServer from '../resources/resource_server'

class NumbersServer extends ResourceServer implements INumbersServer {
  constructor () {
    super(Kind.NUMBER, numberDecoder)
  }

  async listNumbers (
    call: grpc.ServerUnaryCall<ListNumbersRequest>,
    callback: grpc.sendUnaryData<ListNumbersResponse>
  ) {
    super.listResources(call, callback)
  }

  async createNumber (
    call: grpc.ServerUnaryCall<CreateNumberRequest>,
    callback: grpc.sendUnaryData<Number>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      callback(null, await createNumber(call.request.getNumber()))
    } catch (e) {
      callback(e, null)
    }
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
    super.getResource(call, callback)
  }

  async deleteNumber (
    call: grpc.ServerUnaryCall<DeleteNumberRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    super.deleteResource(call, callback)
  }
}

export { NumbersServer as default, INumbersService, NumbersService }
