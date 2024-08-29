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
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

async function createRAGComponents(embeddings: OpenAIEmbeddings) {
  const urlCache: Map<string, MemoryVectorStore> = new Map();
  let currentVectorStore: MemoryVectorStore | null = null;

  async function loadAndIndexURL(url: string) {
    if (urlCache.has(url)) {
      currentVectorStore = urlCache.get(url)!;
      return;
    }

    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    const splitDocs = await textSplitter.splitDocuments(docs);

    const newVectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddings
    );

    urlCache.set(url, newVectorStore);
    currentVectorStore = newVectorStore;
  }

  async function queryVectorStore(query: string, k = 3): Promise<string> {
    if (!currentVectorStore) {
      return "No content has been loaded yet.";
    }

    const results = await currentVectorStore.similaritySearch(query, k);

    return results.map((doc: Document) => doc.pageContent).join("\n\n");
  }

  return {
    loadAndIndexURL,
    queryVectorStore,
    clearCache: () => {
      urlCache.clear();
      currentVectorStore = null;
    }
  };
}

export { createRAGComponents };
