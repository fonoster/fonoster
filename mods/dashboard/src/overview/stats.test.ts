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
import { callStats, rangeAfter } from "./stats";

const now = new Date(2026, 9, 14, 11, 30);
const call = (startedAt: Date, fields: object = {}) =>
  ({
    ref: String(Math.random()),
    startedAt,
    duration: 60,
    status: "NORMAL_CLEARING",
    direction: "FROM_PSTN",
    ...fields
  }) as never;

describe("overview stats", () => {
  it("starts today at local midnight and other ranges N days back", () => {
    expect(rangeAfter("today", now)).toEqual(new Date(2026, 9, 14));
    expect(rangeAfter("7d", now)).toEqual(
      new Date(now.getTime() - 7 * 86_400_000)
    );
  });

  it("totals calls, minutes, completion and average length", () => {
    const stats = callStats(
      [
        call(new Date(2026, 9, 14, 9), { duration: 90 }),
        call(new Date(2026, 9, 14, 10), {
          duration: 150,
          direction: "TO_PSTN"
        }),
        call(new Date(2026, 9, 14, 10), { duration: 0, status: "NO_ANSWER" })
      ],
      "today",
      now
    );
    expect(stats).toMatchObject({ calls: 3, minutes: 4, averageDuration: 120 });
    expect(stats.answerRate).toBeCloseTo(2 / 3);
    expect(stats.reasons.map((r) => [r.label, r.count])).toEqual([
      ["Completed", 2],
      ["No answer", 1]
    ]);
  });

  it("buckets today by hour and other ranges by day", () => {
    const today = callStats(
      [
        call(new Date(2026, 9, 14, 10)),
        call(new Date(2026, 9, 14, 10), { direction: "TO_PSTN" })
      ],
      "today",
      now
    );
    expect(today.volume).toHaveLength(12);
    expect(today.volume[10]).toMatchObject({
      label: "10 AM",
      inbound: 1,
      outbound: 1
    });

    const week = callStats([call(new Date(2026, 9, 12, 8))], "7d", now);
    expect(week.volume).toHaveLength(7);
    expect(week.volume[4]).toMatchObject({ label: "Oct 12", inbound: 1 });
    expect(week.volume[6].label).toBe("Oct 14");
  });

  it("has no rates without calls", () => {
    const stats = callStats([], "30d", now);
    expect(stats.answerRate).toBeUndefined();
    expect(stats.averageDuration).toBeUndefined();
    expect(stats.volume).toHaveLength(30);
  });
});
