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
import { APIClient, ClientOptions } from "@fonoster/common";
import { StorageClient } from "../service/protos/storage_grpc_pb";
import StoragePB from "../service/protos/storage_pb";
import CommonPB from "../service/protos/common_pb";
import {
  GetObjectURLRequest,
  UploadObjectRequest,
  GetObjectURLResponse,
  UploadObjectResponse,
  IStorageClient
} from "./types";
import { promisifyAll } from "grpc-promise";
import {
  getObjectServiceUtils,
  isDirectory,
  uploadServiceUtils
} from "./utils";

/**
 * @classdesc Use Fonoster Storage, a capability of Fonoster Object Storage subsystem,
 * to upload, download, and delete objects.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk")
 * const storage = new Fonoster.Storage()
 *
 * storage.uploadObject()
 * .then(result => {
 *    console.log(result)            // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Storage extends APIClient implements IStorageClient {
  /**
   * Constructs a new Storage object.
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(StorageClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Upload an object toFonosterObject Storage subsystem.
   *
   * @param {UploadObjectRequest} request - Object with information about the origin and
   * destination of an object
   * @param {string} request.bucket - Bucket at the Storage system
   * @param {string} request.dir - Directory on the Storage system where your objec will be uploaded
   * @param {string} request.filename - Path to the object to be uploaded
   * @return {Promise<UploadObjectResponse>} localy accessible URL to the object
   * @throws if the path does not exist or if is a directory
   * @throws if the directory does not exist
   * @example
   *
   * const request = {
   *    filename: "/path/to/file",
   *    bucket: "apps",
   *    directory: "/"
   * }
   *
   * storage.uploadObject(request)
   * .then(() => {
   *   console.log(result)            // returns and empty Object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async uploadObject(
    request: UploadObjectRequest
  ): Promise<UploadObjectResponse> {
    if (isDirectory(request.filename)) {
      throw new Error("Uploading a directory is not supported");
    }
    // Passing empty UploadObjectRequest only for initialization
    const uor = new StoragePB.UploadObjectRequest();
    const result = await this.getService().uploadObject().sendMessage(uor);
    const size = await uploadServiceUtils(request, result.stream);
    return { size };
  }

  /**
   * Get Object URL.
   *
   * @param {GetObjectURLRequest} request - Object with information about the location and
   * and name of the requested object
   * @param {string} request.filename - The name of the object
   * save your file.
   * @param {string} request.accessKeyId - Optional access key id
   * @return {Promise<getObjectURLResponse>} localy accessible URL to the object
   * @throws if directory or object doesn't exist
   * @example
   *
   * const request = {
   *    filename: "object-name",
   *    bucket: "bucket-name"
   * }
   *
   * storage.getObjectURL(request)
   * .then(result => {
   *   console.log(result)
   * }).catch(e => console.error(e))  // an error occurred
   */
  async getObjectURL(
    request: GetObjectURLRequest
  ): Promise<GetObjectURLResponse> {
    const result = await this.getService()
      .getObjectURL()
      .sendMessage(getObjectServiceUtils(request));

    return { url: result.getUrl() };
  }
}

export { StoragePB, CommonPB, IStorageClient };

// WARNING: Workaround to support commonjs clients
module.exports = Storage;
