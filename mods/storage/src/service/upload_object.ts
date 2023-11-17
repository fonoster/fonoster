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
import logger from "@fonoster/logger";
import fs from "fs";
import { UploadObjectRequest } from "./protos/storage_pb";
import { getAccessKeyId } from "@fonoster/core";
import { getFilesizeInBytes, isCompressFile } from "../utils/files";
import { handleCompressUpload, handleUncompressUpload } from "../utils/helper";
import { getBucketAsString, handleError } from "../utils/utils";
const objectid = require("bson-objectid");

export default async function (call: any, callback: any) {
  const tmpName = objectid();
  const writeStream = fs.createWriteStream(`/tmp/${tmpName}`);
  let object: string;
  let bucket: string;
  let accessKeyId = getAccessKeyId(call);

  call.on("error", (err: any) => {
    logger.log(
      "error",
      `@fonoster/storage upload [an error ocurred while uploading object ${object} to bucket '${bucket}']`
    );
    logger.log("error", err);
  });

  call.on("end", () => writeStream.end());

  call.on("data", (request: UploadObjectRequest) => {
    const chunk = request.getChunks();

    if (chunk.length === 0) return;

    writeStream.write(Buffer.alloc(chunk.length, chunk as string));

    if (!object && request.getFilename()) {
      object = request.getFilename();
      bucket = getBucketAsString(request.getBucket());
      if (
        request.getAccessKeyId() &&
        request.getBucket() === UploadObjectRequest.Bucket.PUBLIC
      ) {
        accessKeyId = request.getAccessKeyId();
      }
      logger.debug(
        `@fonoster/storage upload [started uploading object ${object} into "${bucket}" bucket]`
      );
    }

    logger.log(
      "verbose",
      `@fonoster/storage upload [received chunk(${chunk.length}) for ${object}]`
    );
  });

  writeStream.on("finish", async () => {
    try {
      const fileSize = getFilesizeInBytes(`/tmp/${tmpName}`);
      fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`);

      logger.verbose(
        `@fonoster/storage upload [moved ${tmpName} into ${object} (final name)]`
      );

      logger.verbose(
        `@fonoster/storage upload [uploading file to storage backend (s3)]`
      );

      const response = isCompressFile(object)
        ? await handleCompressUpload(accessKeyId, object, bucket, fileSize)
        : await handleUncompressUpload(accessKeyId, object, bucket, fileSize);

      logger.verbose(
        `@fonoster/storage upload [removing tmp file /tmp/${object}]`
      );

      fs.unlink(`/tmp/${object}`, () => callback(null, response));
    } catch (e) {
      logger.log("error", `@fonoster/storage upload [${e}]`);
      callback(handleError(e, bucket));
    }
  });
}
