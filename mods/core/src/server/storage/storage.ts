import grpc from 'grpc'
import {
  UploadObjectRequest,
  UploadObjectResponse,
  GetObjectURLRequest,
  GetObjectURLResponse
} from '../protos/storage_pb'
import { IStorageServer, StorageService } from '../protos/storage_grpc_pb'
import getObjectURL from './get_object_url'

class StorageServer implements IStorageServer {
  uploadObject (
    call: grpc.ServerReadableStream<UploadObjectRequest>,
    callback: grpc.sendUnaryData<UploadObjectResponse>
  ): void {
    const response = new UploadObjectResponse()
    response.setSize(666)
    callback(null, response)
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
