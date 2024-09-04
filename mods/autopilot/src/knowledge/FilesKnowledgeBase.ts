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
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Embeddings } from "@langchain/core/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { AbstractKnowledgeBase } from "./AbstractKnowledgeBase";

class FilesKnowledgeBase extends AbstractKnowledgeBase {
  files: string[];

  constructor(private params: { embeddings?: Embeddings; files: string[] }) {
    super(params);
    this.files = params?.files || [];
  }

  async load(): Promise<void> {
    const { files } = this;

    if (files.length === 0) {
      throw new Error("No files provided");
    } else if (!files.every((file) => file.endsWith(".pdf"))) {
      throw new Error("Only PDF files are supported");
    }

    const loaders = files.map(
      (file: string) => new PDFLoader(file, { splitPages: false })
    );

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
}

export { FilesKnowledgeBase };
