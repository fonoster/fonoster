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
import { getLogger } from "@fonoster/logger";
import { SynthOptions, TtsConfig } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

abstract class AbstractTextToSpeech<
  E,
  T extends TtsConfig = TtsConfig,
  S extends SynthOptions = SynthOptions
> {
  abstract readonly engineName: E;

  constructor(config: T) {
    logger.silly("tts pathToFiles", { engine: config.pathToFiles });
  }

  abstract synthesize(text: string, options: S): Promise<string>;

  getName(): E {
    return this.engineName;
  }
}

export { AbstractTextToSpeech };
