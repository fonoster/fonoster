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
// 1 credit = $0.01: Stripe amounts in cents are credits.

const int = new Intl.NumberFormat("en-US");
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export const credits = (cents: number) => int.format(cents);
export const number = (n: number) => int.format(n);
export const dollars = (cents: number) => usd.format(cents / 100);
/** A credit amount off an invoice, with a real minus sign. */
export const minusDollars = (cents: number) =>
  cents ? `−${dollars(cents)}` : dollars(0);

// Fake time is test-clock time; shown in UTC so it reads the same everywhere.
const iso = (seconds: number) => new Date(seconds * 1000).toISOString();
export const date = (seconds?: number | null) =>
  seconds ? iso(seconds).slice(0, 10) : "—";
export const dateTime = (seconds?: number | null) =>
  seconds ? iso(seconds).slice(0, 19).replace("T", " ") : "—";
export const time = (seconds?: number | null) =>
  seconds ? iso(seconds).slice(11, 19) : "—";
/** "Nov 4", with the year when it isn't `year`'s (the test clock's). */
export const shortDate = (seconds: number, year?: number) => {
  const d = new Date(seconds * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(year !== undefined && d.getUTCFullYear() !== year
      ? { year: "numeric" }
      : {}),
    timeZone: "UTC"
  });
};
