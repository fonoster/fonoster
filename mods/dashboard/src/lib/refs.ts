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

/** The "None" choice in a reference select (Radix Select can't use ""). */
export const NONE = "__none";

/**
 * What an edit sends for a reference: the new ref, "" when the user moved a set ref to None
 * (the API removes it), or undefined when it didn't change (the API keeps it).
 */
export function refUpdate(
  next: string | undefined,
  before: string | null | undefined
): string | undefined {
  const now = next && next !== NONE ? next : undefined;
  const was = before || undefined;
  if (now === was) return undefined;
  return now ?? "";
}

/** { [field]: value } when an edit changed the reference, else {}. */
export function refField<K extends string>(
  field: K,
  next: string | undefined,
  before: string | null | undefined
): Partial<Record<K, string>> {
  const value = refUpdate(next, before);
  return value === undefined
    ? {}
    : ({ [field]: value } as Partial<Record<K, string>>);
}
