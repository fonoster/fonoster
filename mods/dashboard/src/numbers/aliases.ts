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
import type { INumber } from "@fonoster/types";
import { formatNumber } from "./routing";

/** Routr's rule for an alias (fonoster/routr#692). */
const ALIAS = /^[A-Za-z0-9+*._-]{1,60}$/;

export const ALIAS_RULE_MESSAGE =
  "Each alias is 1 to 60 letters, digits or + * . _ -.";

/** The field's text as a list: split on commas, trimmed, without empty parts or repeats. */
export function parseAliases(text: string): string[] {
  return [
    ...new Set(
      text
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean)
    )
  ];
}

/** Whether every alias in the text follows Routr's rule. */
export function aliasesValid(text: string): boolean {
  return parseAliases(text).every((alias) => ALIAS.test(alias));
}

/**
 * What a save sends for the field: a non-empty list replaces the aliases; an emptied field
 * removes them only when the Number had some; otherwise nothing (an absent list keeps them).
 */
export function aliasesRequest(
  text: string,
  saved?: string[]
): { aliases?: string[]; clearAliases?: boolean } {
  const aliases = parseAliases(text);
  if (aliases.length) return { aliases };
  return saved?.length ? { clearAliases: true } : {};
}

const DUPLICATE =
  /alias "([^"]+)" is already used by Number (\S+) on this Trunk/;

/**
 * The field's message for Routr's duplicate-alias refusal, found anywhere in the error (the
 * API prefixes it with the status, "3 INVALID_ARGUMENT: "), with the other Number's phone and
 * name instead of its ref; undefined for any other error.
 */
export function duplicateAliasMessage(
  error: unknown,
  numbers: INumber[]
): string | undefined {
  const message = (error as { message?: unknown })?.message;
  const match = typeof message === "string" ? DUPLICATE.exec(message) : null;
  if (!match) return undefined;
  const [, alias, ref] = match;
  const owner = numbers.find((n) => n.ref === ref);
  const who = owner
    ? `${formatNumber(owner.telUrl)} (${owner.name})`
    : "another number";
  return `${alias} is already an alias of ${who} on this trunk. Remove it there or use another.`;
}
