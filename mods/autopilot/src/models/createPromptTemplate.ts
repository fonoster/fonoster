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
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate
} from "@langchain/core/prompts";

export function createPromptTemplate(systemTemplate: string) {
  return ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder("history"),
    SystemMessagePromptTemplate.fromTemplate(systemTemplate),
    SystemMessagePromptTemplate.fromTemplate("{context}"),
    // This is how the model will know the current date
    SystemMessagePromptTemplate.fromTemplate(
      `current date:${new Date().toISOString()}`
    ),
    HumanMessagePromptTemplate.fromTemplate("{input}")
  ]);
}
