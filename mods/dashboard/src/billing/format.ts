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
// Credits and money as the Billing page shows them: 1 credit = $0.01.

const INT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

/** "1,840" (the balance may be negative in the overdraft). */
export const credits = (n: number) => INT.format(Math.round(n));
/** "$18.40" for 1,840 credits. */
export const dollars = (n: number) => USD.format(n / 100);
/** "Dec 4, 2026" from an ISO 8601 date. */
export const longDate = (iso: string) => DATE.format(new Date(iso));
