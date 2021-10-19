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
import Auth from "@fonos/auth";
import Storage from "@fonos/storage";
import logger from "@fonos/logger";

export const uploadRecording = async (
  accessKeyId: string,
  filename: string
) => {
  logger.verbose(
    `@fonos/dispatcher creating short-life token [accessKeyId = ${accessKeyId}]`
  );
  const auth = new Auth();
  // Creates a PROJECT level token with 10 minutes expiration
  const access = await auth.createToken({
    accessKeyId,
    expiration: "10m",
    roleName: "PROJECT"
  });
  const storage = new Storage({accessKeyId, accessKeySecret: access.token});

  logger.verbose(
    `@fonos/dispatcher uploading file to storage subsystem [filename = ${filename}]`
  );

  if (!process.env.RECORDINGS_PATH) {
    throw new Error("environment variable 'RECORDINGS_PATH' is not set");
  }

  await storage.uploadObject({
    // TODO: Place bucket name on a constant
    bucket: "recordings",
    filename: `${process.env.RECORDINGS_PATH}/${filename}`
  });
};
