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
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { z } from "zod";

/**
 * A price in credits per unit: one number for the meter, or by provider (`*` for any), then by
 * model (`*` for any).
 */
const price = z.union([
  z.number().nonnegative(),
  z.record(
    z.string(),
    z.union([
      z.number().nonnegative(),
      z.record(z.string(), z.number().nonnegative())
    ])
  )
]);

export const rateCardSchema = z
  .object({
    version: z.number().int().positive(),
    startsAt: z.coerce.date(),
    /** Where the vendor prices came from, and when. */
    source: z.string().min(1),
    prices: z.record(z.string(), price)
  })
  .strict();

export type RateCard = z.output<typeof rateCardSchema>;

/** The price of one unit in credits, or undefined when the card has none (the rater's rule 9). */
export function priceOf(
  card: RateCard,
  meter: string,
  provider?: string,
  model?: string
): number | undefined {
  const byMeter = card.prices[meter];
  if (byMeter === undefined || typeof byMeter === "number") return byMeter;
  const byProvider: number | Record<string, number> | undefined =
    byMeter[provider ?? "*"] ?? byMeter["*"];
  if (byProvider === undefined || typeof byProvider === "number")
    return byProvider;
  return byProvider[model ?? "*"] ?? byProvider["*"];
}

/** Every card in a directory (`<startsAt date>.yaml`), validated, oldest start first. */
export function loadRateCards(dir: string): RateCard[] {
  return readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => {
      try {
        return rateCardSchema.parse(parse(readFileSync(join(dir, f), "utf8")));
      } catch (e) {
        throw new Error(`rate card ${f}: ${(e as Error).message}`);
      }
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** The card in force at a moment: the latest that started at or before it (D3). */
export function cardAt(cards: RateCard[], at: Date): RateCard | undefined {
  return cards.filter((c) => c.startsAt.getTime() <= at.getTime()).at(-1);
}
