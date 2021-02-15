import grpc from 'grpc'
import { Empty } from '../protos/common_pb'
import deleteResource from '../resources/delete_resource'
import { Kind } from '../../common/resource_encoder'
import getResource from '../resources/get_resource'
import listResourcesHere from '../resources/list_resources'
import getAccessKeyId from '../resources/get_access_key_id'

export default class ResourceServer {
  kind: Kind
  decoder: Function

  constructor (kind: Kind, decoder: Function) {
    console.log('super.kind=', kind)
    this.kind = kind
    this.decoder = decoder
  }

  async listResources (
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<any>
  ) {
    console.log('dbg001')
    try {
      console.log('dbg002', this)
      const r = await listResourcesHere(
        getAccessKeyId(call),
        this.kind,
        parseInt(call.request.getPageToken()),
        call.request.getPageSize(),
        this.decoder
      )
      console.log('dbg003')
      callback(null, r)
    } catch (e) {
      console.error(e)
      callback(e, null)
    }
  }

  async getResource (
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<any>
  ) {
    try {
      callback(
        null,
        await getResource(
          getAccessKeyId(call), 
          call.request.getRef(), 
          this.kind, 
          this.decoder)
      )
    } catch (e) {
      callback(e, null)
    }
  }

  async deleteResource (
    call: grpc.ServerUnaryCall<any>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      callback(null, await deleteResource(
        getAccessKeyId(call), 
        call.request.getRef(), this.kind, this.decoder
      ))
    } catch (e) {
      callback(e, null)
    }
  }
}
