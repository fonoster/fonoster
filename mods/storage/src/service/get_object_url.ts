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
import grpc from "@grpc/grpc-js";
import { FonosterError } from "@fonoster/errors";
import { fsInstance } from "../utils/storage";

export default async function (
  accessKeyId: string,
  bucket: string,
  filename: string
): Promise<string> {
  logger.log(
    "debug",
    `@fonoster/core getObjectURL [bucket: ${bucket}, filename: ${filename}, accessKeId: ${accessKeyId}}]`
  );

  return new Promise((resolve, reject) => {
    fsInstance().statObject(
      bucket,
      `${accessKeyId}/${filename}`,
      (err: { message: string }) => {
        if (err) {
          reject(
            new FonosterError(
              `${err.message}: filename ${accessKeyId}/${filename} in bucket '${bucket}'`,
              grpc.status.NOT_FOUND
            )
          );
          return;
        }
        resolve(
          `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${bucket}/${accessKeyId}/${filename}`
        );
      }
    );
  });
}
