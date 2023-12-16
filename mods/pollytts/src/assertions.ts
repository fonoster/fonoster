/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
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

// TODO: Move to @fonoster/common
export const assertFileExist = (file: string): void => {
  if (!fs.existsSync(file))
    throw new Error(`the file '${file}' does not exist`);
};

export const assertFileIsWellForm = (file: string): void => {
  try {
    require(file);
  } catch (e) {
    throw new Error(`the file '${file}' is malformed`);
  }
};
