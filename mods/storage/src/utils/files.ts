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
import fs from "fs";
import tar from "tar";
import logger from "@fonoster/logger";
import { FonosterError } from "@fonoster/errors";

export const extract = (source: string, target: string) =>
  tar.extract({ file: source, cwd: target });

export const getFilesizeInBytes = (filename: string) => {
  if (!fs.existsSync(filename)) {
    throw new FonosterError(`file ${filename} does not exist`);
  }
  return fs.statSync(filename)["size"];
};

export const isCompressFile = (object: string) =>
  object.endsWith(".zip") ||
  object.endsWith(".tar") ||
  object.endsWith(".tgz") ||
  object.endsWith(".tar.gz");

export const removeDirSync = (pathToFile: string) => {
  if (fs.existsSync(pathToFile)) {
    const files = fs.readdirSync(pathToFile);

    if (files.length > 0) {
      files.forEach(function (filename: string) {
        if (fs.statSync(pathToFile + "/" + filename).isDirectory()) {
          removeDirSync(pathToFile + "/" + filename);
        } else {
          fs.unlinkSync(pathToFile + "/" + filename);
        }
      });
      fs.rmdirSync(pathToFile);
    } else {
      fs.rmdirSync(pathToFile);
    }
  } else {
    logger.log("warn", "Directory path not found.");
  }
};
