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
import grpc from "@grpc/grpc-js";
import {FonosError} from "@fonos/errors";
import {fsInstance} from "../utils/storage";

export default async function (
  accessKeyId: string,
  bucket: string,
  filename: string
): Promise<string> {
  logger.log(
    "debug",
    `@fonos/core getObjectURL [bucket: ${bucket}, filename: ${filename}, accessKeId: ${accessKeyId}}]`
  );

  return new Promise((resolve, reject) => {
    fsInstance().statObject(
      bucket,
      `${accessKeyId}/${filename}`,
      (err: {message: string}) => {
        if (err) {
          reject(
            new FonosError(
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
