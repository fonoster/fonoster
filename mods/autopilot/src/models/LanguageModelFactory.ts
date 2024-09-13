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
import { AbstractLanguageModel } from "./AbstractLanguageModel";
import { LANGUAGE_MODEL_NAME as GROQ_LLM_NAME, Groq, GroqParams } from "./groq";
import {
  LANGUAGE_MODEL_NAME as OLLAMA_LLM_NAME,
  Ollama,
  OllamaParams
} from "./ollama";
import {
  LANGUAGE_MODEL_NAME as OPENAI_LLM_NAME,
  OpenAI,
  OpenAIParams
} from "./openai";
import { BaseModelParams, TelephonyContext } from "./types";
import { LANGUAGE_MODEL_PROVIDER } from "../types";
import { Voice } from "../voice";

const logger = getLogger({ service: "autopilot", filePath: __filename });

type LanguageModelConstructor<T extends BaseModelParams = BaseModelParams> =
  new (
    options: T,
    voice: Voice,
    telephonyContext: TelephonyContext
  ) => AbstractLanguageModel;

type LanguageModelConfigMap = {
  [LANGUAGE_MODEL_PROVIDER.OPENAI]: OpenAIParams;
  [LANGUAGE_MODEL_PROVIDER.GROQ]: GroqParams;
  [LANGUAGE_MODEL_PROVIDER.OLLAMA]: OllamaParams;
};

class LanguageModelFactory {
  private static languageModels: Map<string, LanguageModelConstructor> =
    new Map();

  static registerLanguageModel<T extends BaseModelParams>(
    name: string,
    ctor: LanguageModelConstructor<T>
  ) {
    logger.verbose("registering llm provider", { name });
    this.languageModels.set(name, ctor);
  }

  static getLanguageModel<T extends keyof LanguageModelConfigMap>(
    languageModel: T,
    config: LanguageModelConfigMap[T],
    voice: Voice,
    telephonyContext: TelephonyContext
  ): AbstractLanguageModel {
    const LanguageModelConstructor = this.languageModels.get(
      `llm.${languageModel}`
    );
    if (!LanguageModelConstructor) {
      throw new Error(`Language model ${languageModel} not found`);
    }
    return new LanguageModelConstructor(config, voice, telephonyContext);
  }
}

// Register language models
LanguageModelFactory.registerLanguageModel(OPENAI_LLM_NAME, OpenAI);
LanguageModelFactory.registerLanguageModel(GROQ_LLM_NAME, Groq);
LanguageModelFactory.registerLanguageModel(OLLAMA_LLM_NAME, Ollama);

export { LanguageModelFactory };
