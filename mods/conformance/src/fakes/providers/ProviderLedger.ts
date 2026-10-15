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
export type ProviderInterval = {
  provider: string;
  start: number;
  end?: number;
};

/**
 * Records when fake providers were deliberately slow (injected delays and held-open timeouts),
 * so a runner can subtract provider time and measure only what the implementation added.
 */
export class ProviderLedger {
  readonly intervals: ProviderInterval[] = [];

  open(provider: string, start = Date.now()): ProviderInterval {
    const interval: ProviderInterval = { provider, start };
    this.intervals.push(interval);
    return interval;
  }

  close(interval: ProviderInterval, end = Date.now()) {
    if (interval.end === undefined) interval.end = end;
  }

  /** Total time in [from, to] covered by at least one interval (overlaps count once). */
  delayBetween(from: number, to: number): number {
    const spans = this.intervals
      .map((i) => [Math.max(from, i.start), Math.min(to, i.end ?? to)] as const)
      .filter(([s, e]) => e > s)
      .sort((a, b) => a[0] - b[0]);

    let total = 0;
    let cursor = -Infinity;
    for (const [s, e] of spans) {
      const start = Math.max(s, cursor);
      if (e > start) {
        total += e - start;
        cursor = e;
      }
    }
    return total;
  }
}
