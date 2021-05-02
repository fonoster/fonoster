/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import {FonosService, ServiceOptions} from "@fonos/core";
import {StorageClient} from "../service/protos/storage_grpc_pb";
import StoragePB from "../service/protos/storage_pb";
import CommonPB from "../service/protos/common_pb";
import {
  GetObjectURLRequest,
  UploadObjectRequest,
  getObjectURLResponse,
  UploadObjectResponse
} from "./types";
import {promisifyAll} from "grpc-promise";
import {utils} from "./utils";
import grpc from "grpc";

/**
 * @classdesc Use Fonos Storage, a capability of Fonos Object Storage subsystem,
 * to upload, download, and delete objects.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require("@fonos/sdk")
 * const storage = new Fonos.Storage()
 *
 * storage.uploadObject()
 * .then(result => {
 *    console.log(result)            // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Storage extends FonosService {
  /**
   * Constructs a new Storage object.
   * @param {ServiceOptions} options - Options to indicate the objects endpoint
   * @see module:core:FonosService
   */
  constructor(options?: ServiceOptions) {
    super(StorageClient, options);
    super.init(grpc);
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  /**
   * Upload an object to Fonos Object Storage subsystem.
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
    if (utils.isDirectory(request.filename)) {
      throw new Error("Uploading a directory is not supported");
    }
    // Must pass empty UploadObjectRequest
    const uor = new StoragePB.UploadObjectRequest();

    const result = await this.getService().uploadObject().sendMessage(uor);
    const size = utils.uploadServiceUtils(request, result.stream);
    return {
      size: size
    };
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
  ): Promise<getObjectURLResponse> {
    const result = await this.getService()
      .getObjectURL()
      .sendMessage(utils.getObjectServiceUtils(request));

    return {url: result.getUrl()};
  }

  /**
   * Upload an object to Fonos Object Storage subsystem with synchronous method.
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
  uploadObjectSync(request: UploadObjectRequest): UploadObjectResponse {
    const sleep = require("sync").sleep;
    let result;
    let error;

    this.uploadObject(request)
      .then((r) => (result = r))
      .catch((e) => (error = e));

    while (result === undefined && error === undefined) sleep(100);

    if (error) throw error;

    return result;
  }

  /**
   * Get Object URL with synchronous method.
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
  getObjectURLSync(request: GetObjectURLRequest): getObjectURLResponse {
    const sleep = require("sync").sleep;
    let result;
    let error;
    this.getObjectURL(request)
      .then((r) => (result = r))
      .catch((e) => (error = e));

    while (result === undefined && error === undefined) sleep(100);

    if (error) throw error;

    return result;
  }
}

export {StoragePB, CommonPB};
