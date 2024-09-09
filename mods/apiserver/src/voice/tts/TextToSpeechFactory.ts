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
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { ENGINE_NAME as AZURE_ENGINE_NAME, Azure } from "./Azure";
import { ENGINE_NAME as DEEPGRAM_ENGINE_NAME, Deepgram } from "./Deepgram";
import { ENGINE_NAME as GOOGLE_ENGINE_NAME, Google } from "./Google";
import { TtsConfig } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type EngineConstructor<T extends TtsConfig = TtsConfig> = new (
  options: T
) => AbstractTextToSpeech<string>;

class TextToSpeechFactory {
  private static engines: Map<string, EngineConstructor> = new Map();

  static registerEngine<T extends TtsConfig>(
    name: string,
    ctor: EngineConstructor<T>
  ) {
    logger.verbose("registering tts engine", { name });
    this.engines.set(name, ctor);
  }

  static getEngine<T extends TtsConfig>(
    engineName: string,
    config: T
  ): AbstractTextToSpeech<string> {
    const EngineConstructor = this.engines.get(engineName);
    if (!EngineConstructor) {
      throw new Error(`Engine ${engineName} not found`);
    }
    return new EngineConstructor(config);
  }
}

// Register engines
TextToSpeechFactory.registerEngine(GOOGLE_ENGINE_NAME, Google);
TextToSpeechFactory.registerEngine(AZURE_ENGINE_NAME, Azure);
TextToSpeechFactory.registerEngine(DEEPGRAM_ENGINE_NAME, Deepgram);

export { TextToSpeechFactory };
