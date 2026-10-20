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
import { formatDate, formatNumber, toDate } from "./format";

describe("format", () => {
  const now = new Date("2026-10-14T12:00:00Z");

  it("reads seconds, milliseconds, Dates and strings", () => {
    expect(toDate(1_791_900_000)?.getUTCFullYear()).toBe(2026);
    expect(toDate(1_791_900_000_000)?.getUTCFullYear()).toBe(2026);
    expect(toDate(new Date("2026-01-02"))?.getUTCMonth()).toBe(0);
    expect(toDate("not a date")).toBeNull();
    expect(toDate(undefined)).toBeNull();
  });

  it("drops the year for dates in the current year", () => {
    expect(formatDate(new Date("2026-10-02T12:00:00Z"), now)).toBe("Oct 2");
    expect(formatDate(new Date("2025-10-02T12:00:00Z"), now)).toBe(
      "Oct 2, 2025"
    );
    expect(formatDate(null, now)).toBe("—");
  });

  it("groups phone numbers by country code", () => {
    expect(formatNumber("tel:+18295550110")).toBe("+1 829 555 0110");
    expect(formatNumber("+34910555211")).toBe("+34 910 555 211");
    expect(formatNumber("+442071838750")).toBe("+44 207 183 8750");
    expect(formatNumber("+50622345678")).toBe("+506 2234 5678");
    expect(formatNumber("sip:alice@acme.com")).toBe("sip:alice@acme.com");
  });
});
