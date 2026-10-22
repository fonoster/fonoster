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
import { nextVoiceLevel } from "./use-browser-call";

// The mic's halo follows the call's audio: it eases in slowly, settles slower, and ignores room noise.
describe("nextVoiceLevel", () => {
  it("eases in when someone speaks", () => {
    expect(nextVoiceLevel(0, 0.115)).toBeCloseTo(0.06);
    expect(nextVoiceLevel(0.06, 0.115)).toBeCloseTo(0.1128);
  });

  it("treats sound under the gate as silence", () => {
    expect(nextVoiceLevel(0, 0.01)).toBe(0);
    expect(nextVoiceLevel(0.5, 0.01)).toBeCloseTo(0.475);
  });

  it("settles slowly in silence, and stays put when silent", () => {
    expect(nextVoiceLevel(0.6, 0)).toBeCloseTo(0.57);
    expect(nextVoiceLevel(0, 0)).toBe(0);
  });

  it("never goes past full", () => {
    let level = 0;
    for (let i = 0; i < 200; i++) level = nextVoiceLevel(level, 1);
    expect(level).toBeLessThanOrEqual(1);
    expect(level).toBeGreaterThan(0.99);
  });
});
