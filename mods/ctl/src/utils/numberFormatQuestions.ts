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
import { NumberFormat, TrunkNumberFormats } from "@fonoster/types";

/** The prompts the questions use, injected so a test can answer them. */
type Prompts = {
  select: (config: {
    message: string;
    choices: { name: string; value: NumberFormat }[];
    default?: NumberFormat;
  }) => Promise<NumberFormat>;
  input: (config: { message: string; default?: string }) => Promise<string>;
};

const FORMAT_CHOICES = [
  { name: "Leave as is", value: NumberFormat.NUMBER_FORMAT_UNSPECIFIED },
  { name: "+E.164", value: NumberFormat.E164 },
  { name: "E.164 without +", value: NumberFormat.E164_WITHOUT_PLUS },
  { name: "National", value: NumberFormat.NATIONAL },
  { name: "International", value: NumberFormat.INTERNATIONAL }
];

/** Routr takes a prefix only with these formats (fonoster/routr#704). */
const TAKES_PREFIX = [
  NumberFormat.E164_WITHOUT_PLUS,
  NumberFormat.NATIONAL,
  NumberFormat.INTERNATIONAL
];

/**
 * Asks for a Trunk's called and caller number formats, and a prefix only after a format that
 * takes one. On update (`current` given) the stored values are the defaults and every field is
 * sent: Leave as is resets the format and a prefix not asked or left empty is sent as "", since
 * Routr checks the Trunk as it would be stored. On create, Leave as is and an empty prefix send
 * nothing.
 */
async function askNumberFormats(
  prompts: Prompts,
  current?: TrunkNumberFormats
): Promise<TrunkNumberFormats> {
  const answers: TrunkNumberFormats = {};
  for (const [party, label] of [
    ["called", "Called"],
    ["caller", "Caller"]
  ] as const) {
    const format = await prompts.select({
      message: `${label} number format`,
      choices: FORMAT_CHOICES,
      default:
        current?.[`${party}NumberFormat`] ??
        NumberFormat.NUMBER_FORMAT_UNSPECIFIED
    });
    const prefix = TAKES_PREFIX.includes(format)
      ? await prompts.input({
          message: `${label} number prefix (optional: digits, * and #)`,
          default: current?.[`${party}NumberPrefix`] || undefined
        })
      : "";
    if (current) {
      answers[`${party}NumberFormat`] = format;
      answers[`${party}NumberPrefix`] = prefix.trim();
    } else {
      if (format !== NumberFormat.NUMBER_FORMAT_UNSPECIFIED)
        answers[`${party}NumberFormat`] = format;
      if (prefix.trim()) answers[`${party}NumberPrefix`] = prefix.trim();
    }
  }
  return answers;
}

export { askNumberFormats };
