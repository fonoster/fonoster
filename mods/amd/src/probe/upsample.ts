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
const HALF_TAPS = 16;

// Half-band windowed-sinc (Blackman) taps at offsets ±(k + 0.5), normalized
// to unity DC gain. Linear interpolation measurably loses accuracy here: its
// imaging above 4 kHz is enough to lower the classifier's confidence.
const TAPS = (() => {
  const taps = new Float64Array(HALF_TAPS);
  let sum = 0;
  for (let k = 0; k < HALF_TAPS; k++) {
    const offset = k + 0.5;
    const sinc = Math.sin(Math.PI * offset) / (Math.PI * offset);
    const u = (offset + HALF_TAPS) / (2 * HALF_TAPS);
    const window =
      0.42 - 0.5 * Math.cos(2 * Math.PI * u) + 0.08 * Math.cos(4 * Math.PI * u);
    taps[k] = sinc * window;
    sum += 2 * taps[k];
  }
  return taps.map((t) => t / sum);
})();

/** Upsamples 8 kHz s16le mono PCM to 16 kHz s16le mono. */
function upsample8kTo16k(pcm: Buffer): Buffer {
  const count = Math.floor(pcm.length / 2);
  const out = Buffer.alloc(count * 4);
  const sample = (i: number) =>
    pcm.readInt16LE(2 * Math.min(Math.max(i, 0), count - 1));

  for (let i = 0; i < count; i++) {
    let interpolated = 0;
    for (let k = 0; k < HALF_TAPS; k++) {
      interpolated += TAPS[k] * (sample(i - k) + sample(i + 1 + k));
    }
    out.writeInt16LE(pcm.readInt16LE(2 * i), 4 * i);
    out.writeInt16LE(
      Math.max(-32768, Math.min(32767, Math.round(interpolated))),
      4 * i + 2
    );
  }

  return out;
}

export { upsample8kTo16k };
