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
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIParams } from "./types";
import { convertToolToOpenAITool } from "../../tools";
import { AbstractLanguageModel } from "../AbstractLanguageModel";

const LANGUAGE_MODEL_NAME = "llm.openai";

class OpenAI extends AbstractLanguageModel {
  constructor(params: OpenAIParams) {
    const model = new ChatOpenAI({
      ...params
    }).bind({
      tools: params.tools.map(convertToolToOpenAITool)
    }) as BaseChatModel;

    super({
      ...params,
      model
    });
  }
}

export { OpenAI, LANGUAGE_MODEL_NAME };
