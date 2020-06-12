import grpc from 'grpc'
import {
  UploadObjectRequest,
  UploadObjectResponse,
  GetObjectURLRequest,
  GetObjectURLResponse
} from '../protos/storage_pb'
import { IStorageServer, StorageService } from '../protos/storage_grpc_pb'
import getObjectURL from './get_object_url'
import uploadObject from './upload_object'

class StorageServer implements IStorageServer {
  uploadObject (
    call: grpc.ServerReadableStream<UploadObjectRequest>,
    callback: grpc.sendUnaryData<UploadObjectResponse>
  ): void {
    //if (!auth(call)) return callback(new FonosAuthError())

    try {
      uploadObject(call, callback)
      //const response = new UploadObjectResponse()
      //response.setSize(size)
      //callback(null, response)
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
