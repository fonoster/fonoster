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
import { S3Loader } from "@langchain/community/document_loaders/web/s3";
import { AbstractKnowledgeBase } from "./AbstractKnowledgeBase";
import { S3KnowledgeBaseParams } from "./types";

class S3KnowledgeBase extends AbstractKnowledgeBase {
  constructor(private params: S3KnowledgeBaseParams) {
    super(params);
    this.params = params;
  }

  async getLoaders(): Promise<S3Loader[]> {
    const { documents } = this.params;
    if (!documents.every((file) => file.endsWith(".pdf"))) {
      throw new Error("Only PDF files are supported");
    }

    const { bucket, s3Config, unstructuredAPIURL, unstructuredAPIKey } =
      this.params;

    return documents.map(
      (document) =>
        new S3Loader({
          bucket,
          key: document,
          s3Config,
          unstructuredAPIURL,
          unstructuredAPIKey
        })
    );
  }
}

export { S3KnowledgeBase };
