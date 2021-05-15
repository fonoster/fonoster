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
import walk from "walk";
import path from "path";
import logger from "@fonos/logger";
import policyForBucket from "../bucket_policy";
import {join} from "path";

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({
    path: join(__dirname, "..", "..", "..", "..", ".env")
  });
}

export const fsInstance = () => {
  const Minio = require("minio");
  return new Minio.Client({
    endPoint: process.env.FS_HOST,
    port: parseInt(process.env.FS_PORT),
    useSSL: false,
    accessKey: process.env.FS_USERNAME,
    secretKey: process.env.FS_SECRET
  });
};

export const uploadToFS = (
  accessKeyId: string,
  bucket: string,
  pathToObject: string,
  object?: string,
  metadata: object = {}
) =>
  new Promise<void>((resolve, reject) => {
    const splitPath = (p: string) => path.dirname(p).split(path.sep);
    const dirCount = splitPath(pathToObject).length;
    const baseDir = splitPath(pathToObject).slice(0, dirCount).join("/");
    const walker = walk.walk(pathToObject);

    walker.on(
      "file",
      (root: string, stats: {name: string}, next: () => void) => {
        const filePath = root + "/" + stats.name;
        const destFilePath = root + "/" + (object || stats.name);
        const dest =
          `${accessKeyId}/` + destFilePath.substring(baseDir.length + 1);

        fsInstance().fPutObject(
          bucket,
          dest,
          filePath,
          metadata,
          (err: any) => {
            if (err) {
              reject(err);
            } else {
              next();
            }
          }
        );
      }
    );

    walker.on("errors", (root: any, nodeStatsArray: any, next: any) => {
      reject(root);
    });

    walker.on("end", () => {
      resolve();
    });
  });


export default async function (bucket: string) {
  const fsConn = fsInstance();
  const exists = await fsConn.bucketExists(bucket);

  if (!exists) {
    logger.log(
      "verbose",
      `@fonos/core fsutils [Creating storage and setting policy bucket: ${bucket}]`
    );
    await fsConn.makeBucket(bucket, "us-west-1");
    await fsConn.setBucketPolicy(bucket, policyForBucket(bucket));
  }
}
