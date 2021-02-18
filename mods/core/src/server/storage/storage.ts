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
import getAccessKeyId from '../../common/get_access_key_id'

const getBucketName = (bucket:GetObjectURLRequest.Bucket) => {
  switch (bucket) {
    case GetObjectURLRequest.Bucket.APPS:
      return 'apps'
    case GetObjectURLRequest.Bucket.RECORDINGS:
      return 'recordings'
    case GetObjectURLRequest.Bucket.PUBLIC:
      return 'public'
  }
}

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
        getAccessKeyId(call),
        getBucketName(call.request.getBucket()),
        call.request.getFilename()
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
