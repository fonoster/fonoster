import grpc from 'grpc'
import { Empty } from '../protos/common_pb'
import deleteResource from '../resources/delete_resource'
import { Kind } from '../../common/resource_encoder'
import getResource from '../resources/get_resource'
import listResourcesHere from '../resources/list_resources'
import getAccessKeyId from '../../common/get_access_key_id'

export default class ResourceServer {
  kind: Kind
  decoder: Function

  constructor (kind: Kind, decoder: Function) {
    //this.kind = kind
    //this.decoder = decoder
  }

  async listResources (
    kind: any,
    decoder: Function,
    call ?: grpc.ServerUnaryCall<any>,
    callback ?: grpc.sendUnaryData<any>
  ) {
    try {
      const r = await listResourcesHere(
        getAccessKeyId(call),
        kind,
        parseInt(call.request.getPageToken()),
        call.request.getPageSize(),
        decoder
      )
      callback(null, r)
    } catch (e) {
      console.error(e)
      callback(e, null)
    }
  }

  async getResource (
    kind: any,
    decoder: Function,
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<any>
  ) {
    try {
      callback(
        null,
        await getResource(
          kind,
          decoder,
          getAccessKeyId(call), 
          call.request.getRef()
        )
      )
    } catch (e) {
      callback(e, null)
    }
  }

  async deleteResource (
    kind: any,
    decoder: Function,
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      callback(null, await deleteResource(
        getAccessKeyId(call), 
        call.request.getRef(), kind, decoder
      ))
    } catch (e) {
      callback(e, null)
    }
  }
}
