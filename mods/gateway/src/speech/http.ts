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
import { SpeechError, Synthesis } from "./types";

/** Shared HTTP plumbing for streaming TTS vendors: timeouts, error mapping, body streaming. */
export async function streamingPost(
  url: string,
  init: { headers: Record<string, string>; body: string },
  signal: AbortSignal,
  timeoutMs: number,
  vendor: string
): Promise<Synthesis["audio"]> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: init.headers,
      body: init.body,
      signal: controller.signal
    });
  } catch (e) {
    if (timeout.aborted)
      throw new SpeechError(
        "provider_timeout",
        `${vendor} did not answer within ${timeoutMs} ms`
      );
    if (signal.aborted) throw e;
    throw new SpeechError(
      "provider_unavailable",
      `${vendor} unreachable: ${(e as Error).message}`
    );
  }
  if (res.status === 400 || res.status === 422) {
    throw new SpeechError(
      "bad_message",
      `${vendor} rejected the request (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`
    );
  }
  if (!res.ok || !res.body)
    throw new SpeechError(
      "provider_unavailable",
      `${vendor} answered HTTP ${res.status}`
    );

  const body = res.body;
  return (async function* () {
    const reader = body.getReader();
    // Vendors may split samples across chunks; keep byte pairs together.
    let odd: Buffer | undefined;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        let chunk = Buffer.from(value);
        if (odd) {
          chunk = Buffer.concat([odd, chunk]);
          odd = undefined;
        }
        if (chunk.length % 2) {
          odd = chunk.subarray(chunk.length - 1);
          chunk = chunk.subarray(0, chunk.length - 1);
        }
        if (chunk.length) yield chunk;
      }
    } catch (e) {
      if (timeout.aborted)
        throw new SpeechError("provider_timeout", `${vendor} stalled`);
      if (!signal.aborted)
        throw new SpeechError("provider_unavailable", (e as Error).message);
    } finally {
      signal.removeEventListener("abort", abort);
    }
  })();
}
