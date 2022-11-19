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
import { UploadObjectResponse } from "../service/protos/storage_pb";
import { extract, removeDirSync } from "./files";
import { uploadToFS } from "./storage";
import logger from "@fonoster/logger";

export const handleCompressUpload = async (
  accessKeyId: string,
  object: string,
  bucket: string,
  fileSize: number
) => {
  const response = new UploadObjectResponse();
  const nameWithoutExt = object.split(".")[0];
  response.setSize(fileSize);
  logger.verbose(`@fonoster/storage helper [extrating ${object} into /tmp]`);
  await extract(`/tmp/${object}`, "/tmp");
  logger.verbose(
    `@fonoster/storage helper [uploading ${nameWithoutExt} to bucket ${bucket}]`
  );
  await uploadToFS(accessKeyId, bucket, `/tmp/${nameWithoutExt}`);
  logger.verbose(`@fonoster/storage helper [removing /tmp/${nameWithoutExt}]`);
  removeDirSync(`/tmp/${nameWithoutExt}`);
  return response;
};

export const handleUncompressUpload = async (
  accessKeyId: string,
  object: string,
  bucket: string,
  fileSize: number
) => {
  const response = new UploadObjectResponse();
  response.setSize(fileSize);
  await uploadToFS(accessKeyId, bucket, `/tmp/${object}`, object);
  return response;
};
