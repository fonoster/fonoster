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
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export function createChatHistory() {
  const chatHistory = new InMemoryChatMessageHistory();

  return {
    getMessages: () => chatHistory.getMessages(),
    addUserMessage: (text: string) =>
      chatHistory.addMessage(new HumanMessage(text)),
    addAIMessage: (text: string) => chatHistory.addMessage(new AIMessage(text)),
    clear: () => chatHistory.clear()
  };
}
