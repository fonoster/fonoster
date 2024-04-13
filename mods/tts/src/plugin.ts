/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { SynthResult, TTSConfig, TTSPlugin } from "./types";
import { Plugin } from "@fonoster/common";
import { computeFilename } from "./utils";
import path from "path";
import fs from "fs";
import os from "os";

export default abstract class AbstractTTS extends Plugin implements TTSPlugin {
  config: TTSConfig;

  constructor(type: string, name: string, config: TTSConfig) {
    super(type, name);
    this.config = config;
    this.config.path = config.path ? config.path : os.tmpdir();
  }

  /**
   * @inherit
   */
  async synthesize(text: string, options: any = {}): Promise<SynthResult> {
    const filename = computeFilename(text, options, "wav16");
    const pathToFile = path.join(this.config.path, filename);

    if (!fs.existsSync(pathToFile)) {
      return await this.synthesizeSpeech(text, options, filename, pathToFile);
    }
    return { filename, pathToFile };
  }

  abstract synthesizeSpeech(
    text: string,
    options: any,
    filename: string,
    pathToFile: string
  ): Promise<SynthResult>;
}
