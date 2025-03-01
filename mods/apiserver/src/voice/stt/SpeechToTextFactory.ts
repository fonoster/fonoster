/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import { AbstractSpeechToText } from "./AbstractSpeechToText";
import { Deepgram, ENGINE_NAME as DEEPGRAM_ENGINE_NAME } from "./Deepgram";
import { Google, ENGINE_NAME as GOOGLE_ENGINE_NAME } from "./Google";
import { SttConfig } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type EngineConstructor<T extends SttConfig = SttConfig> = new (
  options: T
) => AbstractSpeechToText<string>;

class SpeechToTextFactory {
  private static engines: Map<string, EngineConstructor> = new Map();

  static registerEngine<T extends SttConfig>(
    name: string,
    ctor: EngineConstructor<T>
  ) {
    logger.verbose("registering stt engine", { name });
    this.engines.set(name, ctor);
  }

  static getEngine<T extends SttConfig>(
    engineName: string,
    config: T
  ): AbstractSpeechToText<string> {
    const EngineConstructor = this.engines.get(engineName);
    if (!EngineConstructor) {
      throw new Error(`Engine ${engineName} not found`);
    }
    return new EngineConstructor(config);
  }
}

// Register engines
SpeechToTextFactory.registerEngine(GOOGLE_ENGINE_NAME, Google);
SpeechToTextFactory.registerEngine(DEEPGRAM_ENGINE_NAME, Deepgram);

export { SpeechToTextFactory };
