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

/** Money is integer milli-credits: 1 credit = 1000 milli-credits = $0.01 (add-billing-service D5). */
export const MILLI_PER_CREDIT = 1000n;

export const credits = (n: number): bigint =>
  BigInt(Math.round(n * Number(MILLI_PER_CREDIT)));

/** Milli-credits as credits, for display. */
export const toCredits = (milli: bigint): number =>
  Number(milli) / Number(MILLI_PER_CREDIT);

/** Credits as US cents (1 credit = 1 cent). */
export const centsOf = (milli: bigint): bigint => milli / MILLI_PER_CREDIT;
