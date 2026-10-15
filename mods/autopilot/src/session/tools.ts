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
import { URL } from "url";
import { ToolDefinition } from "./config";

export type ToolOutcome = { ok: boolean; result?: unknown; error?: string };

/** The tool port (rework-autopilot A7): one operation, run a tool with inputs. */
export interface ToolPort {
  run(
    name: string,
    args: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<ToolOutcome>;
}

/** HTTP tools from the assistant config (`operation.method`, `url`, `headers`). */
export class HttpToolPort implements ToolPort {
  constructor(private readonly tools: ToolDefinition[]) {}

  async run(
    name: string,
    args: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<ToolOutcome> {
    const tool = this.tools.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool ${name}` };
    const method = String(tool.operation.method ?? "get").toUpperCase();
    const url = new URL(tool.operation.url);
    let body: string | undefined;
    if (method === "GET") {
      for (const [k, v] of Object.entries(args))
        url.searchParams.set(k, String(v));
    } else {
      body = JSON.stringify(args);
    }
    try {
      const request = fetch(url, {
        method,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...(tool.operation.headers ?? {})
        },
        body,
        signal
      });
      if (tool.operation.waitForResponse === false) {
        request.catch(() => undefined);
        return { ok: true, result: { status: "sent" } };
      }
      const res = await request;
      const text = await res.text();
      if (!res.ok)
        return {
          ok: false,
          error: `HTTP ${res.status}: ${text.slice(0, 200)}`
        };
      try {
        return { ok: true, result: JSON.parse(text) };
      } catch {
        return { ok: true, result: text };
      }
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
