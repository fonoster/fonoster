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
import { Usage } from "@fonoster/common";

/** Where embedding usage goes (the session's usage sink). */
export type EmbeddingUsageSink = {
  usage(lines: Usage.UsageLine[]): void;
  missing(catalogId: string): void;
};

/**
 * OpenAI embeddings that report their token usage (add-usage-metering): the knowledge base's
 * embeddings, called directly so the vendor's `usage.prompt_tokens` is not lost. Same defaults
 * as LangChain's OpenAIEmbeddings (model text-embedding-ada-002, 512 texts per request); it
 * implements the embedDocuments/embedQuery pair LangChain's vector stores use.
 */
export class MeteredEmbeddings {
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(
    private readonly options: {
      apiKey: string;
      keySource: Usage.KeySource;
      sink?: EmbeddingUsageSink;
      model?: string;
      baseUrl?: string;
      batchSize?: number;
    }
  ) {
    this.model = options.model ?? "text-embedding-ada-002";
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com").replace(
      /\/$/,
      ""
    );
  }

  get catalogId() {
    return `openai/${this.model}`;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const size = this.options.batchSize ?? 512;
    const batches = Array.from(
      { length: Math.ceil(texts.length / size) },
      (_, i) => texts.slice(i * size, (i + 1) * size)
    );
    const vectors = await Promise.all(batches.map((b) => this.embed(b)));
    return vectors.flat();
  }

  async embedQuery(text: string): Promise<number[]> {
    return (await this.embed([text]))[0];
  }

  private async embed(input: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({ model: this.model, input })
    });
    if (!res.ok) throw new Error(`embeddings answered HTTP ${res.status}`);
    const body = (await res.json()) as {
      data: { index: number; embedding: number[] }[];
      usage?: { prompt_tokens?: number };
    };
    const tokens = body.usage?.prompt_tokens;
    if (tokens === undefined) this.options.sink?.missing(this.catalogId);
    else
      this.options.sink?.usage([
        {
          meter: "embedding.tokens",
          quantity: tokens,
          provider: "openai",
          model: this.catalogId,
          keySource: this.options.keySource
        }
      ]);
    return [...body.data]
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}
