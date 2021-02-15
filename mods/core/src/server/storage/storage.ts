import grpc from 'grpc'
import getObjectURL from './get_object_url'
import uploadObject from './upload_object'
import {
  UploadObjectRequest,
  UploadObjectResponse,
  GetObjectURLRequest,
  GetObjectURLResponse
} from '../protos/storage_pb'
import { IStorageServer, StorageService } from '../protos/storage_grpc_pb'

class StorageServer implements IStorageServer {
  async uploadObject (
    call: grpc.ServerReadableStream<UploadObjectRequest>,
    callback: grpc.sendUnaryData<UploadObjectResponse>
  ): Promise<void> {

    try {
      await uploadObject(call, callback)
    } catch (e) {
      callback(e, null)
    }
  }

  async getObjectURL (
    call: grpc.ServerUnaryCall<GetObjectURLRequest>,
    callback: grpc.sendUnaryData<GetObjectURLResponse>
  ): Promise<void> {

    try {
      const url = await getObjectURL(
        call.request.getBucket(),
        call.request.getName()
      )
      const response = new GetObjectURLResponse()
      response.setUrl(url)
      callback(null, response)
    } catch (e) {
      callback(e, null)
    }
  }
}

export { StorageServer as default, IStorageServer, StorageService }
