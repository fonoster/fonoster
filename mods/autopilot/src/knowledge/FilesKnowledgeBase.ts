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
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Embeddings } from "@langchain/core/embeddings";
import { AbstractKnowledgeBase } from "./AbstractKnowledgeBase";

class FilesKnowledgeBase extends AbstractKnowledgeBase {
  constructor(private params: { embeddings?: Embeddings; files: string[] }) {
    super(params);
    this.params = params;
  }

  async getLoaders(): Promise<PDFLoader[]> {
    const { files } = this.params;

    if (!files.every((file) => file.endsWith(".pdf"))) {
      throw new Error("Only PDF files are supported");
    }

    return files.map(
      (file: string) => new PDFLoader(file, { splitPages: false })
    );
  }
}

export { FilesKnowledgeBase };
