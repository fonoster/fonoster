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

// Caller audio as it arrives from Asterisk: 16 kHz mono signed 16-bit PCM
// (slin16). Frames are usually 20 ms (320 samples) but filters must accept
// any length.
const SAMPLE_RATE = 16000;

type AudioFilter = {
  readonly name: string;
  // Algorithmic latency the filter adds, in milliseconds
  readonly delayMs: number;
  // Resolves once the filter can process audio; rejects if it can't start.
  // Until then the filter is expected to pass audio through.
  ready?(): Promise<void>;
  // Must return a frame with the same number of samples
  process(frame: Int16Array): Int16Array | Promise<Int16Array>;
  // End-of-stream summary, e.g. { gatedPct: 12.5 }
  getStats?(): Record<string, number>;
  // Current internal state, used by the filter bench for plots
  inspect?(): Record<string, number>;
  close?(): void;
};

type AudioFilterConfig = {
  name: string;
  options?: Record<string, unknown>;
};

type FilterTimingStats = {
  frames: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
};

type FilterStats = FilterTimingStats & {
  name: string;
  delayMs: number;
  failures: number;
  disabled: boolean;
  // Why the filter was disabled, if it was
  error: string | null;
  filter: Record<string, number>;
};

type ChainStats = {
  total: FilterTimingStats & { delayMs: number };
  filters: FilterStats[];
};

type AudioFilterChain = {
  // Waits for filters that load models or open native handles. Filters that
  // fail to start are disabled, so the chain still passes audio through.
  ready(): Promise<void>;
  // Resolves when every frame handed to process() has finished. Callers wait
  // for this before close(), so nothing is disposed mid-frame.
  drain(): Promise<void>;
  process(frame: Int16Array): Promise<Int16Array>;
  getStats(): ChainStats;
  inspect(): Record<string, Record<string, number>>;
  close(): void;
};

export {
  AudioFilter,
  AudioFilterChain,
  AudioFilterConfig,
  ChainStats,
  FilterStats,
  FilterTimingStats,
  SAMPLE_RATE
};
