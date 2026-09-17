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
import { AudioFilter } from "../../../src/voice/filters";

const SAMPLE_RATE = 16000;

// A 440 Hz tone whose RMS level is `dbfs`
function sineAtDb(dbfs: number, ms: number): Int16Array {
  const amplitude = 32768 * Math.pow(10, dbfs / 20) * Math.SQRT2;
  const length = Math.round((SAMPLE_RATE * ms) / 1000);

  return Int16Array.from({ length }, (_, i) =>
    Math.round(amplitude * Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE))
  );
}

// A constant signal, so output / input is the gain applied to each sample
function constant(value: number, ms: number): Int16Array {
  return new Int16Array(Math.round((SAMPLE_RATE * ms) / 1000)).fill(value);
}

function silence(ms: number): Int16Array {
  return new Int16Array(Math.round((SAMPLE_RATE * ms) / 1000));
}

function concat(...parts: Int16Array[]): Int16Array {
  const out = new Int16Array(parts.reduce((sum, p) => sum + p.length, 0));
  parts.reduce((offset, part) => {
    out.set(part, offset);
    return offset + part.length;
  }, 0);
  return out;
}

function toFrames(signal: Int16Array, size = 320): Int16Array[] {
  return Array.from({ length: Math.ceil(signal.length / size) }, (_, i) =>
    signal.slice(i * size, (i + 1) * size)
  );
}

// Runs frames through a synchronous filter and returns the joined output
function runFilter(filter: AudioFilter, frames: Int16Array[]): Int16Array {
  return concat(...frames.map((f) => filter.process(f) as Int16Array));
}

function rmsDb(signal: Int16Array): number {
  const sum = signal.reduce((acc, s) => acc + s * s, 0);
  return 20 * Math.log10(Math.sqrt(sum / signal.length) / 32768);
}

function msToSamples(ms: number) {
  return Math.round((SAMPLE_RATE * ms) / 1000);
}

export {
  concat,
  constant,
  msToSamples,
  rmsDb,
  runFilter,
  silence,
  sineAtDb,
  toFrames
};
