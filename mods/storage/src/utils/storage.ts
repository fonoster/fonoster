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
import walk from "walk";
import path from "path";
import logger from "@fonoster/logger";
import policyForBucket from "./bucket_policy";

const splitPath = (p: string) => path.dirname(p).split(path.sep);

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

export const uploadToFS = async (
  accessKeyId: string,
  bucket: string,
  pathToObject: string,
  object?: string,
  metadata: object = {}
) =>
  new Promise<void>((resolve, reject) => {
    const dirCount = splitPath(pathToObject).length;
    const baseDir = splitPath(pathToObject).slice(0, dirCount).join("/");
    const walker = walk.walk(pathToObject);

    walker.on(
      "file",
      (root: string, stats: { name: string }, next: () => void) => {
        const filePath = root + "/" + stats.name;
        const destFilePath = root + "/" + (object || stats.name);
        const dest =
          `${accessKeyId}/` + destFilePath.substring(baseDir.length + 1);

        logger.verbose(
          `@fonoster/storage upload fs [uploading ${stats.name} file to ${bucket}]`
        );

        fsInstance().fPutObject(bucket, dest, filePath, metadata, (e: any) => {
          if (e) {
            logger.error(`@fonoster/storage upload fs [${e}]`);
            reject(e);
          } else {
            logger.verbose(
              `@fonoster/storage upload fs [finished uploading ${stats.name} file]`
            );
            next();
          }
        });
      }
    );

    walker.on("errors", (root: any) => {
      reject(root);
    });

    walker.on("end", () => {
      logger.verbose(
        `@fonoster/storage upload fs [finished uploading ${pathToObject}]`
      );
      resolve();
    });
  });

export default async function (bucket: string) {
  const fsConn = fsInstance();
  const exists = await fsConn.bucketExists(bucket);

  if (!exists) {
    logger.log(
      "verbose",
      `@fonoster/core fsutils [Creating storage and setting policy bucket: ${bucket}]`
    );
    await fsConn.makeBucket(bucket, "us-west-1");
    await fsConn.setBucketPolicy(bucket, policyForBucket(bucket));
  }
}
