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
import { AudioStream } from "@fonoster/streams";

// Asterisk's AudioSocket() app always streams slin (8 kHz), whatever the
// channel's native rate.
const SAMPLE_RATE = 8000;
const BYTES_PER_SAMPLE = 2; // mono, 16-bit little-endian

type CollectPcmParams = {
  stream: AudioStream;
  probeMs: number;
  signal: AbortSignal;
};

/**
 * Buffers the first `probeMs` of a call's audio (or whatever arrives before
 * the shared deadline) off an AudioSocket `AudioStream` and returns it as one
 * Buffer. Resolves early once enough audio has accumulated, on the stream
 * closing/erroring, or when `signal` aborts. Never rejects.
 *
 * `AudioStream` exposes no way to remove a single listener, so this settles
 * once via a guard flag rather than detaching — safe here because each
 * AudioStream is scoped to one AGI/AudioSocket session and is torn down right
 * after classification (see `audiosocket/server.ts`).
 */
function collectPcm(params: CollectPcmParams): Promise<Buffer> {
  const { stream, probeMs, signal } = params;
  const bytesNeeded = Math.ceil(
    (probeMs / 1000) * SAMPLE_RATE * BYTES_PER_SAMPLE
  );

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(windowTimer);
      signal.removeEventListener("abort", finish);
      resolve(Buffer.concat(chunks, total));
    };

    stream.onData((chunk: Buffer) => {
      if (settled) return;
      chunks.push(chunk);
      total += chunk.length;
      if (total >= bytesNeeded) finish();
    });
    stream.onClose(finish);
    stream.onError(finish);

    const windowTimer = setTimeout(finish, probeMs);
    signal.addEventListener("abort", finish, { once: true });
  });
}

export { collectPcm };
