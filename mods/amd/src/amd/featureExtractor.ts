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
import { readFileSync } from "fs";

/**
 * A pure-JS re-implementation of Hugging Face `WhisperFeatureExtractor` for the
 * whisper-tiny audio classifier: 16 kHz mono waveform -> log-Mel spectrogram
 * `input_features` of shape [1, 80, 3000], matching `transformers` bit-for-bit
 * (verified against a Python reference fixture).
 *
 * Only the frames whose analysis window overlaps real (non-padding) audio are
 * transformed; the rest are filled with the post-clamp floor, exactly as the
 * reference does for a short clip zero-padded to 30 s.
 */

const N_FFT = 400;
const HOP = 160;
const N_MELS = 80;
const N_FREQ = N_FFT / 2 + 1; // 201
const N_SAMPLES = 480000; // 30 s @ 16 kHz
const N_FRAMES = 3000;
const PAD = N_FFT / 2; // center padding, 200

export const FEATURE_LENGTH = N_MELS * N_FRAMES;
export const INPUT_FEATURES_SHAPE: readonly number[] = [1, N_MELS, N_FRAMES];

// log10 of the reference's magnitude floor (1e-10) — the value every padded
// STFT frame collapses to before the global-max clamp.
const LOG10_FLOOR = Math.log10(1e-10);

// Yield to the event loop this often while running the per-frame DFT, so a probe
// on one call does not stall the other AMD sessions this process serves.
const YIELD_EVERY_FRAMES = 64;

// Periodic Hann window (torch.hann_window default): 0.5 - 0.5*cos(2*pi*n/N).
const HANN = new Float64Array(N_FFT);
for (let n = 0; n < N_FFT; n++) {
  HANN[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / N_FFT);
}

// DFT twiddle tables for a real 400-point transform, bins 0..200.
const COS = new Float64Array(N_FREQ * N_FFT);
const SIN = new Float64Array(N_FREQ * N_FFT);
for (let k = 0; k < N_FREQ; k++) {
  for (let n = 0; n < N_FFT; n++) {
    const angle = (-2 * Math.PI * k * n) / N_FFT;
    COS[k * N_FFT + n] = Math.cos(angle);
    SIN[k * N_FFT + n] = Math.sin(angle);
  }
}

let melFiltersCache: { path: string; data: Float32Array } | null = null;

/** Mel filterbank, row-major [N_FREQ][N_MELS], as written by the reference. */
function loadMelFilters(path: string): Float32Array {
  if (!melFiltersCache || melFiltersCache.path !== path) {
    const buf = readFileSync(path);
    const data = new Float32Array(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    if (data.length !== N_FREQ * N_MELS) {
      throw new Error(
        `mel filter bank at ${path} has ${data.length} values, expected ${N_FREQ * N_MELS}`
      );
    }
    melFiltersCache = { path, data };
  }
  return melFiltersCache.data;
}

/** Signed 16-bit little-endian PCM -> Float32 in [-1, 1). */
export function pcmToFloat32(pcm: Buffer): Float32Array {
  const n = pcm.length >> 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = pcm.readInt16LE(i * 2) / 32768;
  }
  return out;
}

/**
 * Waveform -> `input_features` (Float32Array of length 80*3000, row-major
 * [mel][frame]). `melFiltersPath` points at the committed `mel_filters.bin`.
 * Async only so the per-frame DFT can yield the event loop; the numbers are
 * identical to a synchronous run.
 */
export async function logMelSpectrogram(
  waveform: Float32Array,
  melFiltersPath: string
): Promise<Float32Array> {
  const mel = loadMelFilters(melFiltersPath);

  // Truncate / zero-pad to exactly 30 s, then reflect-pad by PAD for center STFT.
  const sig = new Float64Array(N_SAMPLES);
  const realLen = Math.min(waveform.length, N_SAMPLES);
  for (let i = 0; i < realLen; i++) sig[i] = waveform[i];

  const sampleAt = (p: number): number => {
    let j = p - PAD;
    if (j < 0) j = -j; // reflect at start
    if (j >= N_SAMPLES) j = 2 * (N_SAMPLES - 1) - j; // reflect at end
    return j >= 0 && j < N_SAMPLES ? sig[j] : 0;
  };

  // Frames past this only see zeros; fill them from the floor in pass 2.
  const lastRealFrame = Math.min(
    N_FRAMES,
    Math.ceil((PAD + realLen) / HOP) + 1
  );

  const out = new Float32Array(FEATURE_LENGTH);
  const win = new Float64Array(N_FFT);
  const power = new Float64Array(N_FREQ);
  let globalMax = -Infinity;

  for (let frame = 0; frame < lastRealFrame; frame++) {
    if (frame > 0 && frame % YIELD_EVERY_FRAMES === 0) {
      await new Promise<void>((resolve) => setImmediate(resolve));
    }

    const base = frame * HOP;
    for (let n = 0; n < N_FFT; n++) win[n] = sampleAt(base + n) * HANN[n];

    for (let k = 0; k < N_FREQ; k++) {
      let re = 0;
      let im = 0;
      const c = k * N_FFT;
      for (let n = 0; n < N_FFT; n++) {
        const w = win[n];
        re += w * COS[c + n];
        im += w * SIN[c + n];
      }
      power[k] = re * re + im * im;
    }

    for (let m = 0; m < N_MELS; m++) {
      let acc = 0;
      for (let k = 0; k < N_FREQ; k++) acc += mel[k * N_MELS + m] * power[k];
      const v = Math.log10(acc < 1e-10 ? 1e-10 : acc);
      out[m * N_FRAMES + frame] = v;
      if (v > globalMax) globalMax = v;
    }
  }

  if (!Number.isFinite(globalMax)) globalMax = 0;
  const floor = globalMax - 8.0;

  for (let m = 0; m < N_MELS; m++) {
    const row = m * N_FRAMES;
    for (let frame = 0; frame < N_FRAMES; frame++) {
      // Real frames carry their computed log10 value; padded frames collapse to
      // LOG10_FLOOR. Both are then clamped up to the global-max floor.
      const preClamp = frame < lastRealFrame ? out[row + frame] : LOG10_FLOOR;
      const v = preClamp < floor ? floor : preClamp;
      out[row + frame] = (v + 4.0) / 4.0;
    }
  }

  return out;
}
