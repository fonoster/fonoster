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
import logger from "@fonos/logger";
import grpc from "grpc";
import fs from "fs";
import {FonosError, FonosFailedPrecondition} from "@fonos/errors";
import {
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes
} from "@fonos/core";
import {UploadObjectResponse, UploadObjectRequest} from "./protos/storage_pb";
import {getAccessKeyId} from "@fonos/core";

const objectid = require("objectid");
const isCompressFile = (object: string) =>
  object.endsWith(".zip") ||
  object.endsWith(".tar") ||
  object.endsWith(".tgz") ||
  object.endsWith(".tar.gz");
const handleError = (err: {code: any; message: string}, bucket: string) => {
  switch (err.code) {
    case "NoSuchBucket":
      return new FonosFailedPrecondition(`${err.message} -> bucket: ${bucket}`);
    case "TAR_BAD_ARCHIVE":
      return new FonosError(err.message, grpc.status.DATA_LOSS);
    default:
      return new FonosError(err.message, grpc.status.UNKNOWN);
  }
};

const handleCompressUpload = async (
  accessKeyId: string,
  object: string,
  bucket: string,
  fileSize: number
) => {
  await extract(`/tmp/${object}`, "/tmp");
  const nameWithoutExt = object.split(".")[0];
  await uploadToFS(accessKeyId, bucket, `/tmp/${nameWithoutExt}`);
  removeDirSync(`/tmp/${nameWithoutExt}`);
  const response = new UploadObjectResponse();
  response.setSize(fileSize);
  return response;
};

const handleUncompressUpload = async (
  accessKeyId: string,
  object: string,
  bucket: string,
  fileSize: number
) => {
  await uploadToFS(accessKeyId, bucket, `/tmp/${object}`, object);
  const response = new UploadObjectResponse();
  response.setSize(fileSize);
  return response;
};

export default async function (call: any, callback: any) {
  const tmpName = objectid();
  const writeStream = fs.createWriteStream(`/tmp/${tmpName}`);
  let object: string;
  let bucket: string;
  let accessKeyId = getAccessKeyId(call);

  const getBucketName = (bucket: UploadObjectRequest.Bucket) => {
    switch (bucket) {
      case UploadObjectRequest.Bucket.APPS:
        return "apps";
      case UploadObjectRequest.Bucket.RECORDINGS:
        return "recordings";
      case UploadObjectRequest.Bucket.PUBLIC:
        return "public";
    }
  };

  call.on("error", (err: any) => logger.log("error", err));
  call.on("end", () => writeStream.end());
  call.on("data", (request: UploadObjectRequest) => {
    const chunk = request.getChunks();
    writeStream.write(Buffer.alloc(chunk.length, chunk as string));
    object = request.getFilename();
    bucket = getBucketName(request.getBucket());
    if (
      request.getAccessKeyId() &&
      request.getBucket() === UploadObjectRequest.Bucket.PUBLIC
    ) {
      accessKeyId = request.getAccessKeyId();
    }

    // removed useless assignment
    // metadata = mapToObj(request.getMetadataMap()) // ??
  });

  writeStream.on("finish", async () => {
    try {
      const fileSize = getFilesizeInBytes(`/tmp/${tmpName}`);
      fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`);
      const response = isCompressFile(object)
        ? await handleCompressUpload(accessKeyId, object, bucket, fileSize)
        : await handleUncompressUpload(accessKeyId, object, bucket, fileSize);

      console.log("response", response.toString());
      callback(null, response);
      fs.unlinkSync(`/tmp/${object}`);
    } catch (err) {
      callback(handleError(err, bucket));
    }
  });
}
