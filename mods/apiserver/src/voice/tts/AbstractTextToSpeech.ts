/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import * as fs from "fs";
import { Readable } from "stream";
import { getLogger } from "@fonoster/logger";
import * as z from "zod";
import { computeFilename } from "./computeFilename";
import { SynthOptions, TtsConfig } from "./types";
import { MethodNotImplementedError } from "../MethodNotImplementedError";

const logger = getLogger({ service: "apiserver", filePath: __filename });

abstract class AbstractTextToSpeech<
  E,
  T extends TtsConfig = TtsConfig,
  S extends SynthOptions = SynthOptions
> {
  abstract readonly engineName: E;
  protected abstract OUTPUT_FORMAT: "wav" | "sln16";
  protected abstract CACHING_FIELDS: string[];
  config: T;

  constructor(config: T) {
    logger.silly("tts pathToFiles", { engine: config.pathToFiles });
    this.config = config;
  }

  protected createFilename(text: string, options: SynthOptions): string {
    return computeFilename({
      text,
      options,
      cachingFields: this.CACHING_FIELDS,
      format: this.OUTPUT_FORMAT
    });
  }

  protected fileExists(filename: string): boolean {
    return fs.existsSync(filename);
  }

  protected getFilenameWithoutExtension(filename: string): string {
    return filename.replace(`.${this.OUTPUT_FORMAT}`, "");
  }

  protected getFullPathToFile(filename: string): string {
    return `${this.config.pathToFiles}/${filename}`;
  }

  abstract synthesize(
    text: string,
    options: S
  ): Promise<{ id: string; stream: Readable }>;

  static getConfigValidationSchema(): z.Schema {
    throw new MethodNotImplementedError();
  }

  static getCredentialsValidationSchema(): z.Schema {
    throw new MethodNotImplementedError();
  }

  getName(): E {
    return this.engineName;
  }
}

export { AbstractTextToSpeech };
