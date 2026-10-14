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
