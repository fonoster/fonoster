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
import Auth from "@fonoster/auth";
import Storage from "@fonoster/storage";
import logger from "@fonoster/logger";

export const uploadRecording = async (
  accessKeyId: string,
  filename: string
) => {
  logger.silly("creating short-lived token", { accessKeyId });
  const auth = new Auth();
  // Creates a PROJECT level token with 10 minutes expiration
  const access = await auth.createToken({
    accessKeyId,
    expiration: "10m",
    roleName: "PROJECT"
  });
  const storage = new Storage({ accessKeyId, accessKeySecret: access.token });

  logger.verbose("uploading file to storage subsystem", { filename });

  await storage.uploadObject({
    // TODO: Place bucket name on a constant
    bucket: "recordings",
    filename: `${process.env.RECORDINGS_PATH}/${filename}`
  });
};
