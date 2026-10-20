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
import { MeterName, meterOf } from "./meters";
import { KeySource, parseUsageLine, UsageLine } from "./types";

type Key = {
  meter: MeterName;
  provider?: string;
  model?: string;
  keySource?: KeySource;
};

/**
 * A call's usage, accumulated in memory while it runs (design D1). One entry per meter, provider,
 * model and key source; seconds are kept exact and rounded up only when lines are taken.
 */
export class CallUsage {
  private readonly entries = new Map<string, Key & { quantity: number }>();

  add(line: UsageLine): void {
    const parsed = parseUsageLine(line);
    const key = [
      parsed.meter,
      parsed.provider ?? "",
      parsed.model ?? "",
      parsed.keySource ?? ""
    ].join("|");
    const entry = this.entries.get(key);
    if (entry) entry.quantity += parsed.quantity;
    else
      this.entries.set(key, {
        meter: parsed.meter,
        provider: parsed.provider,
        model: parsed.model,
        keySource: parsed.keySource,
        quantity: parsed.quantity
      });
  }

  /** Adds seconds of a meter measured as a duration in milliseconds. */
  addMillis(key: Key, ms: number): void {
    if (ms > 0) this.add({ ...key, quantity: ms / 1000 });
  }

  lines(): UsageLine[] {
    return Array.from(this.entries.values())
      .map((e) => {
        const quantity =
          meterOf(e.meter).unit === "second"
            ? Math.ceil(e.quantity - 1e-9)
            : Math.round(e.quantity);
        const line: UsageLine = { meter: e.meter, quantity };
        if (e.provider) line.provider = e.provider;
        if (e.model) line.model = e.model;
        if (e.keySource) line.keySource = e.keySource;
        return line;
      })
      .filter((line) => line.quantity > 0);
  }
}
