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
import fs from "fs";
import {UploadObjectRequest} from "./protos/storage_pb";
import {getAccessKeyId} from "@fonos/core";
import {getFilesizeInBytes, isCompressFile} from "../utils/files";
import {handleCompressUpload, handleUncompressUpload} from "../utils/helper";
import {getBucketName, handleError} from "../utils/utils";
const objectid = require("objectid");

export default async function (call: any, callback: any) {
  const tmpName = objectid();
  const writeStream = fs.createWriteStream(`/tmp/${tmpName}`);
  let object: string;
  let bucket: string;
  let accessKeyId = getAccessKeyId(call);

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
  });

  writeStream.on("finish", async () => {
    try {
      fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`);
      const fileSize = getFilesizeInBytes(`/tmp/${tmpName}`);
      const response = isCompressFile(object)
        ? await handleCompressUpload(accessKeyId, object, bucket, fileSize)
        : await handleUncompressUpload(accessKeyId, object, bucket, fileSize);

      fs.unlinkSync(`/tmp/${object}`);
      callback(null, response);
    } catch (err) {
      callback(handleError(err, bucket));
    }
  });
}
