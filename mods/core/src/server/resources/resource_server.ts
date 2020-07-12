import grpc from 'grpc'
import { Empty } from '../protos/common_pb'
import deleteResource from '../resources/delete_resource'
import { Kind } from '../../common/resource_encoder'
import getResource from '../resources/get_resource'
import listResources from '../resources/list_resources'
import { auth } from '../../common/trust_util'
import { FonosAuthError } from '@fonos/errors'

export default class ResourceServer {
  kind: Kind
  decoder: Function

  constructor (kind: Kind, decoder: Function) {
    this.kind = kind
    this.decoder = decoder
  }

  async listResources (
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<any>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)

    try {
      const r = await listResources(
        this.kind,
        parseInt(call.request.getPageToken()),
        call.request.getPageSize(),
        this.decoder
      )
      callback(null, r)
    } catch (e) {
      callback(e, null)
    }
  }

  async getResource (
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<any>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      callback(
        null,
        await getResource(call.request.getRef(), this.kind, this.decoder)
      )
    } catch (e) {
      callback(e, null)
    }
  }

  async deleteResource (
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      callback(null, await deleteResource(call.request.getRef(), this.kind))
    } catch (e) {
      callback(e, null)
    }
  }
}
