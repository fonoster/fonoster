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
import {
  ChatMessage,
  Think,
  ThinkChunk,
  TokenUsage,
  ToolSpec
} from "@fonoster/community";

/** Where a model's usage goes: Autopilot sends it to the call (usage.report). */
export type UsageSink = {
  usage(lines: Usage.UsageLine[]): void;
  /** A completed request whose vendor reported no usage (add-usage-metering). */
  missing(catalogId: string): void;
  /** The knowledge base's embeddings key was rejected: knowledge is off for this call. */
  keyRejected?(event: {
    provider: string;
    catalogId: string;
    status: number;
  }): void;
};

export type MeteredModel = {
  /** The catalog id (`<provider>/<model>`). */
  catalogId: string;
  keySource: Usage.KeySource;
};

/** How long an interrupted reply is read in the background for its usage report (design D6). */
export const DRAIN_DEADLINE_MS = 30_000;

const abortError = () => {
  const e = new Error("aborted");
  e.name = "AbortError";
  return e;
};

/** Resolves like `p`, or rejects with an AbortError as soon as `signal` aborts. */
function raceAbort<T>(p: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    p.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      }
    );
  });
}

export function usageLines(
  model: MeteredModel,
  usage: TokenUsage
): Usage.UsageLine[] {
  const key = {
    provider: model.catalogId.split("/")[0],
    model: model.catalogId,
    keySource: model.keySource
  };
  const lines: Usage.UsageLine[] = [
    { meter: "llm.tokens.in", quantity: usage.inputTokens, ...key },
    { meter: "llm.tokens.out", quantity: usage.outputTokens, ...key }
  ];
  if (usage.cachedTokens > 0)
    lines.push({
      meter: "llm.tokens.cached",
      quantity: usage.cachedTokens,
      ...key
    });
  return lines;
}

/**
 * A Think that meters its model (add-usage-metering D6). Chunks pass through; the vendor's usage
 * chunk is reported, never forwarded. When the caller stops reading (barge-in, a newer turn), the
 * stream ends for the caller at once but keeps being read in the background, so the vendor's usage
 * for the whole request still arrives; after the deadline, or when `closed` aborts (the session
 * ended), the request is reported as missing usage. A request the vendor failed reports nothing.
 */
export function meteredThink(
  inner: Think,
  model: MeteredModel,
  sink: UsageSink,
  options: { drainMs?: number; closed?: AbortSignal } = {}
): Think {
  const settle = (usage?: TokenUsage) =>
    usage
      ? sink.usage(usageLines(model, usage))
      : sink.missing(model.catalogId);

  return {
    async *stream(
      messages: ChatMessage[],
      tools: ToolSpec[],
      signal: AbortSignal
    ): AsyncIterable<ThinkChunk> {
      const request = new AbortController();
      const stopRequest = () => request.abort();
      options.closed?.addEventListener("abort", stopRequest, { once: true });
      const it = inner
        .stream(messages, tools, request.signal)
        [Symbol.asyncIterator]();
      let usage: TokenUsage | undefined;
      let pending: Promise<IteratorResult<ThinkChunk>> | undefined;
      let state: "reading" | "done" | "failed" = "reading";
      const done = () =>
        options.closed?.removeEventListener("abort", stopRequest);

      const drain = async () => {
        const deadline = setTimeout(
          stopRequest,
          options.drainMs ?? DRAIN_DEADLINE_MS
        );
        try {
          for (;;) {
            const r = await (pending ?? it.next());
            pending = undefined;
            if (r.done) break;
            if (r.value.type === "usage") usage = r.value.usage;
          }
        } catch {
          // Cut by the deadline or the session's end: whatever arrived is all there is.
        } finally {
          clearTimeout(deadline);
          done();
        }
        settle(usage);
      };

      try {
        for (;;) {
          pending = it.next();
          pending.catch(() => undefined);
          const r = await raceAbort(pending, signal);
          pending = undefined;
          if (r.done) {
            state = "done";
            break;
          }
          if (r.value.type === "usage") usage = r.value.usage;
          else yield r.value;
        }
      } catch (e) {
        if (!signal.aborted) state = "failed";
        throw e;
      } finally {
        if (state === "done") {
          done();
          settle(usage);
        } else if (state === "failed") {
          done();
        } else {
          void drain();
        }
      }
    }
  };
}
