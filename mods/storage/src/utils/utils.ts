import { FonosError, FonosFailedPrecondition } from "@fonos/errors";
import { UploadObjectRequest } from "../service/protos/storage_pb";

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
import grpc from "grpc";

export const mapToObj = (map: {
  toArray: () => {
    (): any;
    new(): any;
    length: number;
    reduce: { (arg0: (e: any[]) => {}): any; new(): any };
  };
}) => {
  if (!map || map.toArray().length === 0) return {};
  return map.toArray().reduce((e: any[]) => {
    const r: any = {};
    r[e[0]] = e[1];
    return r;
  });
};

export const handleError = (err: { code: any; message: string }, bucket: string) => {
  switch (err.code) {
    case "NoSuchBucket":
      return new FonosFailedPrecondition(`${err.message} -> bucket: ${bucket}`);
    case "TAR_BAD_ARCHIVE":
      return new FonosError(err.message, grpc.status.DATA_LOSS);
    default:
      return new FonosError(err.message, grpc.status.UNKNOWN);
  }
};

export const getBucketName = (bucket: UploadObjectRequest.Bucket) => {
  switch (bucket) {
    case UploadObjectRequest.Bucket.FUNCS:
      return "funcs";
    case UploadObjectRequest.Bucket.APPS:
      return "apps";
    case UploadObjectRequest.Bucket.RECORDINGS:
      return "recordings";
    case UploadObjectRequest.Bucket.PUBLIC:
      return "public";
  }
};
