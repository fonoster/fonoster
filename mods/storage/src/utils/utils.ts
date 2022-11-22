import { FonosterError, FonosterFailedPrecondition } from "@fonoster/errors";
import { UploadObjectRequest } from "../service/protos/storage_pb";

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
import { constants } from "./constants";
import { StoragePB } from "../client/storage";

export const mapToObj = (map: {
  toArray: () => {
    (): any;
    new (): any;
    length: number;
    reduce: { (arg0: (e: any[]) => {}): any; new (): any };
  };
}) => {
  if (!map || map.toArray().length === 0) return {};
  return map.toArray().reduce((e: any[]) => {
    const r: any = {};
    r[e[0]] = e[1];
    return r;
  });
};

export const handleError = (
  err: { code: any; message: string },
  bucket: string
) => {
  switch (err.code) {
    case "NoSuchBucket":
      return new FonosterFailedPrecondition(
        `${err.message} -> bucket: ${bucket}`
      );
    case "TAR_BAD_ARCHIVE":
      return new FonosterError(err.message, grpc.status.DATA_LOSS);
    default:
      return new FonosterError(err.message, grpc.status.UNKNOWN);
  }
};

export const getBucketAsString = (bucket: UploadObjectRequest.Bucket) => {
  switch (bucket) {
    case UploadObjectRequest.Bucket.FUNCS:
      return constants.FUNCS_BUCKET;
    case UploadObjectRequest.Bucket.APPS:
      return constants.APPS_BUCKET;
    case UploadObjectRequest.Bucket.RECORDINGS:
      return constants.RECORDINGS_BUCKET;
    case UploadObjectRequest.Bucket.PUBLIC:
      return constants.PUBLIC_BUCKET;
  }
};

export const getBucketAsPB = (bucket: string): UploadObjectRequest.Bucket => {
  switch (bucket) {
    case constants.APPS_BUCKET:
      return StoragePB.GetObjectURLRequest.Bucket.APPS;
    case constants.FUNCS_BUCKET:
      return StoragePB.GetObjectURLRequest.Bucket.FUNCS;
    case constants.RECORDINGS_BUCKET:
      return StoragePB.GetObjectURLRequest.Bucket.RECORDINGS;
    case constants.PUBLIC_BUCKET:
      return StoragePB.GetObjectURLRequest.Bucket.PUBLIC;
    default:
      throw new FonosterError(`Bucket ${bucket} is not a valid one`);
  }
};
