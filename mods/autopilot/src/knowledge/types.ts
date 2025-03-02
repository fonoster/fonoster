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
import { Embeddings } from "@langchain/core/embeddings";

type KnowledgeBase = {
  load: () => Promise<void>;
  queryKnowledgeBase: (query: string, k?: number) => Promise<string>;
};

type S3KnowledgeBaseParams = {
  embeddings?: Embeddings;
  bucket: string;
  documents: string[];
  s3Config: {
    endpoint: string;
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
    forcePathStyle: boolean;
  };
  unstructuredAPIURL: string;
  unstructuredAPIKey: string;
};

export { KnowledgeBase, S3KnowledgeBaseParams };
