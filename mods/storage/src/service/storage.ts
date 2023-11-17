/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import grpc from "@grpc/grpc-js";
import getObjectURL from "./get_object_url";
import uploadObject from "./upload_object";
import {
  UploadObjectRequest,
  UploadObjectResponse,
  GetObjectURLRequest,
  GetObjectURLResponse
} from "./protos/storage_pb";
import { IStorageServer, StorageService } from "./protos/storage_grpc_pb";
import { getAccessKeyId } from "@fonoster/core";

const getBucketName = (bucket: GetObjectURLRequest.Bucket) => {
  switch (bucket) {
    case GetObjectURLRequest.Bucket.APPS:
      return "apps";
    case GetObjectURLRequest.Bucket.RECORDINGS:
      return "recordings";
    case GetObjectURLRequest.Bucket.PUBLIC:
      return "public";
  }
};

class StorageServer implements IStorageServer {
  [name: string]: grpc.UntypedHandleCall;

  async uploadObject(
    call: grpc.ServerReadableStream<UploadObjectRequest, UploadObjectResponse>,
    callback: grpc.sendUnaryData<UploadObjectResponse>
  ): Promise<void> {
    try {
      await uploadObject(call, callback);
    } catch (e) {
      callback(e, null);
    }
  }

  async getObjectURL(
    call: grpc.ServerUnaryCall<GetObjectURLRequest, GetObjectURLResponse>,
    callback: grpc.sendUnaryData<GetObjectURLResponse>
  ): Promise<void> {
    const bucket = getBucketName(call.request.getBucket());
    let accessKeyId = getAccessKeyId(call);
    if (
      call.request.getAccessKeyId() &&
      call.request.getBucket() === GetObjectURLRequest.Bucket.PUBLIC
    ) {
      accessKeyId = call.request.getAccessKeyId();
    }

    try {
      const url = await getObjectURL(
        accessKeyId,
        bucket,
        call.request.getFilename()
      );
      const response = new GetObjectURLResponse();
      response.setUrl(url);
      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }
}

export { StorageServer as default, IStorageServer, StorageService };
