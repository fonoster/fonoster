import fs from "fs";
import path from "path";
import {constants} from "./constants";
import {StoragePB} from "@fonos/core";
import {UploadObjectRequest, GetObjectURLRequest} from "./types";

interface CallService {
  write(storageObject: StoragePB.UploadObjectRequest);
  end();
}

const isDirectory = (filename: string): boolean => {
  return fs.lstatSync(filename).isDirectory();
};

const getObjectServiceUtils = (
  request: GetObjectURLRequest
): StoragePB.GetObjectURLRequest => {
  let bucket: StoragePB.GetObjectURLRequest.Bucket;
  switch (request.bucket) {
    case constants.APP_BUCKET:
      bucket = StoragePB.GetObjectURLRequest.Bucket.APPS;
      break;
    case constants.RECORDINGS_BUCKET:
      bucket = StoragePB.GetObjectURLRequest.Bucket.RECORDINGS;
      break;
    case constants.PUBLIC_BUCKET:
      bucket = StoragePB.GetObjectURLRequest.Bucket.PUBLIC;
      break;
  }

  const objectUrlRequest = new StoragePB.GetObjectURLRequest();
  objectUrlRequest.setFilename(request.filename);
  objectUrlRequest.setBucket(bucket);
  objectUrlRequest.setAccessKeyId(request.accessKeyId);

  return objectUrlRequest;
};

const uploadServiceUtils = (
  request: UploadObjectRequest,
  callService: CallService
): number => {
  const objectName = path.basename(request.filename);
  const readStream = fs.createReadStream(request.filename, {
    highWaterMark: constants.HIGH_WATER_MARK
  });

  let bucket: StoragePB.UploadObjectRequest.Bucket;
  switch (request.bucket) {
    case constants.APP_BUCKET:
      bucket = StoragePB.UploadObjectRequest.Bucket.APPS;
      break;
    case constants.RECORDINGS_BUCKET:
      bucket = StoragePB.UploadObjectRequest.Bucket.RECORDINGS;
      break;
    case constants.PUBLIC_BUCKET:
      bucket = StoragePB.UploadObjectRequest.Bucket.PUBLIC;
      break;
  }

  readStream
    .on("data", (chunk) => {
      const uor = new StoragePB.UploadObjectRequest();
      uor.setChunks(Buffer.from(chunk));
      uor.setFilename(objectName);
      uor.setBucket(bucket);
      uor.setAccessKeyId(request.accessKeyId);

      if (request.metadata && Object.keys(request.metadata).length > 0) {
        const keys = Object.keys(request.metadata);
        keys.forEach((k) => uor.getMetadataMap().set(k, request.metadata[k]));
      }
      callService.write(uor);
    })
    .on("end", () => {
      callService.end();
    })
    .on("error", () => {
      callService.end();
    });
  return fs.statSync(request.filename)["size"];
};
export const utils = {
  isDirectory,
  uploadServiceUtils,
  getObjectServiceUtils
};
