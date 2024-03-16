/* eslint-disable no-loops/no-loops */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster
 *
 * This file is part of nodejs-voiceapp
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
import { differenceInHours } from "date-fns";
import { getLogger } from "@fonoster/logger";
import fs from "fs";
import path from "path";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export type FileRetentionPolicyConfig = {
  filesDirectory: string;
  maxFileAge: number;
  fileExtension: string;
};

export const runFileRetentionPolicy = (config: FileRetentionPolicyConfig) => {
  logger.verbose(
    "running file retention policy in directory: " + config.filesDirectory
  );

  fs.readdir(config.filesDirectory, (err, files) => {
    if (err) throw err;

    const ttsFiles = files.filter(
      (file) => path.extname(file) === config.fileExtension
    );

    logger.verbose("found " + ttsFiles.length + " files to be deleted");

    for (const file of ttsFiles) {
      const filePath = path.join(config.filesDirectory, file);

      fs.stat(filePath, (err, stats) => {
        if (err) throw err;

        const diff = differenceInHours(new Date(), stats.atime);

        if (diff > config.maxFileAge) {
          logger.verbose(
            "file " + file + " was last accessed " + diff + " hours ago"
          );

          logger.verbose("deleting file " + file);

          fs.unlink(filePath, (err) => {
            if (err) throw err;
          });
        }
      });
    }
  });
};
