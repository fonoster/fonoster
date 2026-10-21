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

// The mic's glow follows the call's audio: it rises fast with a voice and settles slowly.
describe("nextVoiceLevel", () => {
  it("rises quickly when someone speaks", () => {
    expect(nextVoiceLevel(0, 0.1)).toBeCloseTo(0.3);
    expect(nextVoiceLevel(0.3, 0.1)).toBeCloseTo(0.45);
  });

  it("settles slowly in silence, and stays put when silent", () => {
    expect(nextVoiceLevel(0.6, 0)).toBeCloseTo(0.552);
    expect(nextVoiceLevel(0, 0)).toBe(0);
  });

  it("never goes past full", () => {
    let level = 0;
    for (let i = 0; i < 20; i++) level = nextVoiceLevel(level, 1);
    expect(level).toBeLessThanOrEqual(1);
    expect(level).toBeGreaterThan(0.99);
  });
});
