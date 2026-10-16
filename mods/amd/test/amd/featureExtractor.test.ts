/*
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
import { join } from "path";
import { expect } from "chai";
import {
  FEATURE_LENGTH,
  logMelSpectrogram,
  pcmToFloat32
} from "../../src/amd/featureExtractor";

const FIXTURES = join(__dirname, "fixtures");
const MEL_FILTERS = join(__dirname, "..", "..", "amd-model", "mel_filters.bin");

function readF32(path: string): Float32Array {
  const b = readFileSync(path);
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

describe("@amd/featureExtractor", function () {
  it("pcmToFloat32 maps s16le to [-1, 1)", function () {
    const buf = Buffer.alloc(6);
    buf.writeInt16LE(0, 0);
    buf.writeInt16LE(32767, 2);
    buf.writeInt16LE(-32768, 4);
    const f = pcmToFloat32(buf);
    expect(f.length).to.equal(3);
    expect(f[0]).to.equal(0);
    expect(f[1]).to.be.closeTo(1, 1e-4);
    expect(f[2]).to.equal(-1);
  });

  it("matches the reference Whisper feature extractor", async function () {
    // fixture.pcm: 2.7 s of deterministic slin16 audio.
    // fixture_feat.f32: transformers WhisperFeatureExtractor output, [1, 80, 3000].
    const pcm = readFileSync(join(FIXTURES, "fixture.pcm"));
    const expected = readF32(join(FIXTURES, "fixture_feat.f32"));

    const features = await logMelSpectrogram(pcmToFloat32(pcm), MEL_FILTERS);

    expect(features.length).to.equal(FEATURE_LENGTH);
    expect(expected.length).to.equal(FEATURE_LENGTH);

    let maxAbs = 0;
    let sumAbs = 0;
    for (let i = 0; i < FEATURE_LENGTH; i++) {
      const d = Math.abs(features[i] - expected[i]);
      if (d > maxAbs) maxAbs = d;
      sumAbs += d;
    }
    const meanAbs = sumAbs / FEATURE_LENGTH;

    // Naive DFT vs. torch FFT: differences are small and bounded.
    expect(meanAbs).to.be.lessThan(2e-3);
    expect(maxAbs).to.be.lessThan(2e-2);
  });

  it("is deterministic", async function () {
    const pcm = pcmToFloat32(readFileSync(join(FIXTURES, "fixture.pcm")));
    const a = await logMelSpectrogram(pcm, MEL_FILTERS);
    const b = await logMelSpectrogram(pcm, MEL_FILTERS);
    expect(Buffer.from(a.buffer)).to.deep.equal(Buffer.from(b.buffer));
  });
});
