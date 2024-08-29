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
import { Embeddings } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { OpenAIEmbeddings } from "@langchain/openai";
import { KnowledgeBase } from "./types";

abstract class AbstractKnowledgeBase implements KnowledgeBase {
  protected embeddings: Embeddings;
  protected vectorStore: VectorStore;

  constructor(params?: { embeddings?: Embeddings }) {
    this.embeddings = params?.embeddings || new OpenAIEmbeddings();
  }

  abstract load(params: unknown): Promise<void>;

  async queryKnowledgeBase(query: string, k = 5): Promise<string> {
    const { vectorStore } = this;
    if (!vectorStore) {
      throw new Error("Vector store is not initialized");
    }

    const results = await vectorStore.similaritySearch(query, k);

    return results.join("\n");
  }
}

export { AbstractKnowledgeBase };
