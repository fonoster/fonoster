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
/** Edit distance between two strings (insertions, deletions, substitutions). */
function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    prev = row;
  }
  return prev[b.length];
}

/**
 * The known key closest to an unknown one (`turnTakng` → `turnTaking`), when it is close enough
 * to be a typo: at most a third of the key's length (at least 1) edits away, ignoring case.
 */
function suggestKey(unknown: string, known: string[]): string | undefined {
  const limit = Math.max(1, Math.floor(unknown.length / 3));
  let best: { key: string; distance: number } | undefined;
  for (const key of known) {
    const distance = levenshtein(unknown.toLowerCase(), key.toLowerCase());
    if (distance <= limit && (!best || distance < best.distance))
      best = { key, distance };
  }
  return best?.key;
}

export { levenshtein, suggestKey };
