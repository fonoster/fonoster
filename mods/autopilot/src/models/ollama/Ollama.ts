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
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama } from "@langchain/ollama";
import { convertToolToOpenAITool } from "../../tools";
import { Voice } from "../../voice";
import { AbstractLanguageModel } from "../AbstractLanguageModel";
import { TelephonyContext } from "../types";
import { OllamaParams } from "./types";

const LANGUAGE_MODEL_NAME = "llm.ollama";

class Ollama extends AbstractLanguageModel {
  constructor(
    params: OllamaParams,
    voice: Voice,
    telephonyContext: TelephonyContext
  ) {
    const model = new ChatOllama({
      ...params
    }).bindTools(
      params.tools.map(convertToolToOpenAITool)
    ) as unknown as BaseChatModel;

    super(
      {
        ...params,
        model
      },
      voice,
      telephonyContext
    );
  }
}

export { LANGUAGE_MODEL_NAME, Ollama };
