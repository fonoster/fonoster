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
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OPENAI_API_KEY } from "../envs";
import { KnowledgeBase } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

abstract class AbstractKnowledgeBase implements KnowledgeBase {
  protected embeddings: Embeddings;
  protected vectorStore: VectorStore;

  constructor(params?: { embeddings?: Embeddings }) {
    this.embeddings =
      params?.embeddings ||
      new OpenAIEmbeddings({
        apiKey: OPENAI_API_KEY
      });
  }

  abstract getLoaders(): Promise<unknown>;

  async load(): Promise<void> {
    const loaders = (await this.getLoaders()) as {
      load: () => Promise<Document[]>;
    }[];

    if (loaders.length === 0) {
      logger.verbose("no loaders to load");
      // No loaders to load
      return;
    }

    const loadedDocs = await Promise.all(
      loaders.map((loader) => loader.load())
    );

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    const splitDocs = await Promise.all(
      loadedDocs.map((docs) => textSplitter.splitDocuments(docs))
    );

    this.vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs.flat(),
      this.embeddings
    );
  }

  async queryKnowledgeBase(query: string, k = 2): Promise<string> {
    const { vectorStore } = this;

    if (!vectorStore) {
      logger.verbose("vector store is not initialized, returning empty string");
      return "";
    }

    const results = await vectorStore.similaritySearch(query, k);

    return results.join("\n");
  }
}

export { AbstractKnowledgeBase };
