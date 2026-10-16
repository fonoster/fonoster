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
import { expect } from "chai";
import { upsample8kTo16k } from "../../src/probe/upsample";

const sine = (rate: number, hz: number, seconds: number) => {
  const count = rate * seconds;
  const pcm = Buffer.alloc(count * 2);
  for (let i = 0; i < count; i++) {
    pcm.writeInt16LE(Math.round(10000 * Math.sin((2 * Math.PI * hz * i) / rate)), i * 2);
  }
  return pcm;
};

describe("@probe/upsample8kTo16k", function () {
  it("doubles the sample count and keeps the original samples", function () {
    const input = sine(8000, 440, 0.1);

    const output = upsample8kTo16k(input);

    expect(output.length).to.equal(input.length * 2);
    for (let i = 0; i < input.length / 2; i++) {
      expect(output.readInt16LE(i * 4)).to.equal(input.readInt16LE(i * 2));
    }
  });

  it("reconstructs a 16 kHz tone within a few percent", function () {
    const input = sine(8000, 1000, 0.5);
    const expected = sine(16000, 1000, 0.5);

    const output = upsample8kTo16k(input);

    // Skip the filter's edge region, where neighbors are clamped.
    let maxError = 0;
    for (let i = 64; i < output.length / 2 - 64; i++) {
      maxError = Math.max(maxError, Math.abs(output.readInt16LE(i * 2) - expected.readInt16LE(i * 2)));
    }
    expect(maxError).to.be.lessThan(300); // < 3% of the 10000 amplitude
  });

  it("returns an empty buffer for empty input", function () {
    expect(upsample8kTo16k(Buffer.alloc(0)).length).to.equal(0);
  });
});
