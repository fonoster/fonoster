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
// Millisecond histograms: workers count, the primary merges and prints percentiles.

/** Values above this land in the last bucket; max is kept exactly. */
const MAX_MS = 60_000;

export type Histogram = { counts: number[]; n: number; max: number };

export function histogram(): Histogram {
  return { counts: new Array(MAX_MS + 1).fill(0), n: 0, max: 0 };
}

export function record(h: Histogram, ms: number) {
  const value = Math.max(0, Math.round(ms));
  h.counts[Math.min(value, MAX_MS)]++;
  h.n++;
  h.max = Math.max(h.max, value);
}

export function merge(into: Histogram, from: Histogram) {
  from.counts.forEach((c, i) => (into.counts[i] += c));
  into.n += from.n;
  into.max = Math.max(into.max, from.max);
}

function percentile(h: Histogram, p: number): number {
  const rank = Math.ceil((p / 100) * h.n);
  let seen = 0;
  const index = h.counts.findIndex((c) => (seen += c) >= rank);
  return index;
}

export function summary(h: Histogram) {
  if (!h.n) return { n: 0 };
  return {
    n: h.n,
    p50: percentile(h, 50),
    p95: percentile(h, 95),
    p99: percentile(h, 99),
    max: h.max
  };
}
