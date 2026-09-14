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
const BYTES_PER_MS = (SAMPLE_RATE * BYTES_PER_SAMPLE) / 1000;
const FRAME_BYTES = 20 * BYTES_PER_MS;

// Consecutive frames above the threshold needed to call it speech, so a
// single click or line pop doesn't start the window.
const ONSET_FRAMES = 3;

type CollectPcmParams = {
  stream: AudioStream;
  probeMs: number;
  // Mean absolute sample value (0-32767) a 20 ms frame must reach to count
  // as speech.
  speechThreshold: number;
  signal: AbortSignal;
};

type CollectedPcm = {
  // Audio from speech onset on, at most `probeMs` of it.
  pcm: Buffer;
  // Audio received before speech began, in ms; undefined if it never did.
  speechOnsetMs?: number;
  receivedBytes: number;
};

function frameLevel(buffer: Buffer, offset: number): number {
  let sum = 0;
  for (let i = 0; i < FRAME_BYTES; i += BYTES_PER_SAMPLE) {
    sum += Math.abs(buffer.readInt16LE(offset + i));
  }
  return sum / (FRAME_BYTES / BYTES_PER_SAMPLE);
}

/**
 * Buffers a call's audio off an AudioSocket `AudioStream`, starting the probe
 * window at speech onset rather than at connect: whatever the far end sends
 * before it speaks (often seconds of digital silence) is measured, not
 * classified. Resolves once `probeMs` of audio from onset has accumulated,
 * `probeMs` after onset, on the stream closing/erroring, or when `signal`
 * aborts. Never rejects.
 *
 * `AudioStream` exposes no way to remove a single listener, so this settles
 * once via a guard flag rather than detaching — safe here because each
 * AudioStream is scoped to one AGI/AudioSocket session and is torn down right
 * after classification (see `audiosocket/server.ts`).
 */
function collectPcm(params: CollectPcmParams): Promise<CollectedPcm> {
  const { stream, probeMs, speechThreshold, signal } = params;
  const bytesNeeded = Math.ceil(probeMs * BYTES_PER_MS);

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let receivedBytes = 0;
    let settled = false;
    let windowTimer: ReturnType<typeof setTimeout> | undefined;

    // Before onset: bytes from the start of the current candidate run of
    // loud frames, and how many bytes precede it.
    let pending: Buffer = Buffer.alloc(0);
    let bytesBeforePending = 0;
    let loudFrames = 0;
    let speechOnsetMs: number | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(windowTimer);
      signal.removeEventListener("abort", finish);
      resolve({
        pcm: Buffer.concat(chunks, total),
        speechOnsetMs,
        receivedBytes
      });
    };

    const addSpeech = (chunk: Buffer) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total >= bytesNeeded) finish();
    };

    const scanForOnset = (chunk: Buffer) => {
      pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
      let offset = loudFrames * FRAME_BYTES;

      while (pending.length - offset >= FRAME_BYTES) {
        if (frameLevel(pending, offset) < speechThreshold) {
          const drop = offset + FRAME_BYTES;
          bytesBeforePending += drop;
          pending = pending.subarray(drop);
          loudFrames = 0;
          offset = 0;
          continue;
        }

        loudFrames++;
        offset += FRAME_BYTES;
        if (loudFrames === ONSET_FRAMES) {
          speechOnsetMs = Math.round(bytesBeforePending / BYTES_PER_MS);
          windowTimer = setTimeout(finish, probeMs);
          const speech = pending;
          pending = Buffer.alloc(0);
          addSpeech(speech);
          return;
        }
      }
    };

    stream.onData((chunk: Buffer) => {
      if (settled) return;
      receivedBytes += chunk.length;
      if (speechOnsetMs === undefined) scanForOnset(chunk);
      else addSpeech(chunk);
    });
    stream.onClose(finish);
    stream.onError(finish);

    signal.addEventListener("abort", finish, { once: true });
  });
}

export { collectPcm, CollectedPcm };
