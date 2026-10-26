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
import { NumbersLister, someRoutrNumber } from "../utils/someRoutrNumber";

/** The name of the trunk of the workspace's Number, or undefined when it has none. */
type TrunkOfNumber = (
  accessKeyId: string,
  number: string
) => Promise<string | undefined>;

/**
 * A number as a lookup key: `tel:+1555…`, `sip:+1555…@host;params`, `+1555…` and `1555…` are
 * the same Number (Routr keeps telUrls; a call's legs may carry a URI or bare digits).
 */
function numberKey(number: string): string {
  const user = number
    .trim()
    .replace(/^<?(tel|sips?):/i, "")
    .split(/[@;>]/)[0];
  return /^\d+$/.test(user) ? `+${user}` : user;
}

/**
 * Resolves a call's trunk from its Number when the call's record is indexed (#1069): Routr routes
 * a Number's calls through the Number's trunk, both ways. Routr has no lookup by telUrl, so the
 * Numbers are listed once and kept for `ttlMs`. A number not in the list lists them again, at
 * most every `missMs`, so a Number added since is found; one still missing after that is kept
 * as unknown until the next listing. One listing runs at a time, and a failed one is not
 * retried for `missMs`.
 */
function createTrunkOfNumber(
  numbers: NumbersLister,
  options: { ttlMs?: number; missMs?: number; now?: () => number } = {}
): TrunkOfNumber {
  const ttlMs = options.ttlMs ?? 60_000;
  const missMs = options.missMs ?? 10_000;
  const now = options.now ?? Date.now;
  // By workspace and number: the trunk's name, or null for a Number without one or an unknown number.
  let trunks = new Map<string, string | null>();
  let loadedAt = -Infinity;
  let triedAt = -Infinity;
  let loading: Promise<void> | undefined;

  const load = () =>
    (loading ??= (async () => {
      triedAt = now();
      const next = new Map<string, string | null>();
      await someRoutrNumber(numbers, (n) => {
        const accessKeyId = n.extended?.accessKeyId;
        if (n.telUrl && typeof accessKeyId === "string")
          next.set(
            `${accessKeyId} ${numberKey(n.telUrl)}`,
            n.trunk?.name || null
          );
      });
      trunks = next;
      loadedAt = now();
    })().finally(() => (loading = undefined)));

  return async (accessKeyId, number) => {
    if (!accessKeyId || !number) return undefined;
    const key = `${accessKeyId} ${numberKey(number)}`;
    const age = now() - loadedAt;
    const due = age >= ttlMs || (!trunks.has(key) && age >= missMs);
    if (due && (loading || now() - triedAt >= missMs)) {
      await load();
      if (!trunks.has(key)) trunks.set(key, null);
    }
    return trunks.get(key) ?? undefined;
  };
}

export { createTrunkOfNumber, numberKey, TrunkOfNumber };
