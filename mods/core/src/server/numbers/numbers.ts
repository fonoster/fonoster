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
import listResources from '../resources/list_resources'
import { Kind } from '../../common/resource_encoder'
import numberDecoder from '../../common/decoders/number_decoder'
import deleteResource from '../resources/delete_resource'

class NumbersServer implements INumbersServer {
  async listNumbers (
    call: grpc.ServerUnaryCall<ListNumbersRequest>,
    callback: grpc.sendUnaryData<ListNumbersResponse>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const r: any = await listResources(
      parseInt(call.request.getPageToken()),
      call.request.getPageSize(),
      numberDecoder
    )
    callback(null, r)
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
    callback(
      null,
      await getResource(call.request.getRef(), Kind.NUMBER, numberDecoder)
    )
  }

  async deleteNumber (
    call: grpc.ServerUnaryCall<DeleteNumberRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    callback(null, await deleteResource(call.request.getRef(), Kind.DOMAIN))
  }
}

export { NumbersServer as default, INumbersService, NumbersService }
