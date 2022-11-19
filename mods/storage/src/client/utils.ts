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
import fs from "fs";
import path from "path";
import { constants } from "../utils/constants";
import StoragePB from "../service/protos/storage_pb";
import { UploadObjectRequest, GetObjectURLRequest } from "./types";
import { getBucketAsPB } from "../utils/utils";

interface CallService {
  write(storageObject: StoragePB.UploadObjectRequest);
  end();
}

export const isDirectory = (filename: string): boolean => {
  return fs.lstatSync(filename).isDirectory();
};

export const getObjectServiceUtils = (
  request: GetObjectURLRequest
): StoragePB.GetObjectURLRequest => {
  const objectUrlRequest = new StoragePB.GetObjectURLRequest();
  objectUrlRequest.setFilename(request.filename);
  objectUrlRequest.setBucket(getBucketAsPB(request.bucket));
  objectUrlRequest.setAccessKeyId(request.accessKeyId);
  return objectUrlRequest;
};

export const uploadServiceUtils = async (
  request: UploadObjectRequest,
  callService: CallService
): Promise<number> => {
  const objectName = path.basename(request.filename);
  const readStream = fs.createReadStream(request.filename, {
    highWaterMark: constants.HIGH_WATER_MARK
  });

  return new Promise((resolve, reject) => {
    readStream
      .on("data", (chunk) => {
        const uor = new StoragePB.UploadObjectRequest();
        uor.setChunks(Buffer.from(chunk));
        uor.setFilename(objectName);
        uor.setBucket(getBucketAsPB(request.bucket));
        uor.setAccessKeyId(request.accessKeyId);

        if (request.metadata && Object.keys(request.metadata).length > 0) {
          const keys = Object.keys(request.metadata);
          keys.forEach((k) => uor.getMetadataMap().set(k, request.metadata[k]));
        }
        callService.write(uor);
      })
      .on("end", () => {
        resolve(fs.statSync(request.filename)["size"]);
        callService.end();
      })
      .on("error", (err) => {
        callService.end();
        reject(err);
      });
  });
};
