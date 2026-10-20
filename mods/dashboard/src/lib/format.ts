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
/** API timestamps arrive as Date, epoch seconds or epoch milliseconds. */
export function toDate(
  value: Date | number | string | null | undefined
): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number")
    return new Date(value < 1e12 ? value * 1000 : value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});
const LONG = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

/** "Oct 2" this year, "Oct 2, 2025" otherwise, "—" when missing. */
export function formatDate(
  value: Date | number | string | null | undefined,
  now = new Date()
): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.getFullYear() === now.getFullYear()
    ? SHORT.format(date)
    : LONG.format(date);
}

/** Two-digit country calling codes (ITU E.164); 1 and 7 are one digit, the rest three. */
const TWO_DIGIT_CODES = new Set(
  "20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98".split(
    " "
  )
);

/** National digits in readable groups: 3-3-4, 3-3-3, 4-4, else threes. */
function groupNational(digits: string): string {
  const sizes =
    digits.length === 10
      ? [3, 3, 4]
      : digits.length === 9
        ? [3, 3, 3]
        : digits.length === 8
          ? [4, 4]
          : [];
  if (!sizes.length) return digits.replace(/(\d{3})(?=\d{2,})/g, "$1 ");
  let at = 0;
  return sizes.map((size) => digits.slice(at, (at += size))).join(" ");
}

/**
 * "tel:+18295550110" → "+1 829 555 0110", "+34910555211" → "+34 910 555 211".
 * Anything that isn't an E.164 number (SIP URIs, short codes) stays as it is.
 */
export function formatNumber(telUrl: string): string {
  const raw = telUrl.replace(/^tel:/, "");
  const e164 = /^\+(\d{8,15})$/.exec(raw);
  if (!e164) return raw;
  const digits = e164[1];
  const codeLength =
    digits[0] === "1" || digits[0] === "7"
      ? 1
      : TWO_DIGIT_CODES.has(digits.slice(0, 2))
        ? 2
        : 3;
  return `+${digits.slice(0, codeLength)} ${groupNational(digits.slice(codeLength))}`;
}
