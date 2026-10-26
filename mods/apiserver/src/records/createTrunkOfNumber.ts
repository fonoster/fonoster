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
/** One page of Routr's numbers (the Routr SDK's listNumbers), with each Number's trunk. */
type NumbersPage = {
  items?: {
    telUrl?: string;
    trunk?: { name?: string } | null;
    extended?: Record<string, unknown> | null;
  }[];
  nextPageToken?: string;
};

type TrunkNumbersLister = {
  listNumbers(request: {
    pageSize: number;
    pageToken?: string;
  }): Promise<NumbersPage>;
};

/** The name of the trunk of the workspace's Number `e164`, or undefined when it has none. */
type TrunkOfNumber = (
  accessKeyId: string,
  e164: string
) => Promise<string | undefined>;

const PAGE_SIZE = 200;
const MAX_PAGES = 100;

/**
 * Resolves a call's trunk from its Number when the call's record is indexed (#1069): Routr routes
 * a Number's calls through the Number's trunk, both ways. Routr has no lookup by telUrl, so the
 * Numbers are listed once and kept for `ttlMs`; a miss lists them again, at most every
 * `missMs`, so a Number added since is found.
 */
function createTrunkOfNumber(
  numbers: TrunkNumbersLister,
  options: { ttlMs?: number; missMs?: number; now?: () => number } = {}
): TrunkOfNumber {
  const ttlMs = options.ttlMs ?? 60_000;
  const missMs = options.missMs ?? 10_000;
  const now = options.now ?? Date.now;
  let trunks = new Map<string, string>();
  let loadedAt = -Infinity;
  let loading: Promise<void> | undefined;

  const load = () =>
    (loading ??= (async () => {
      const next = new Map<string, string>();
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const res = await numbers.listNumbers({
          pageSize: PAGE_SIZE,
          pageToken
        });
        for (const n of res.items ?? []) {
          const accessKeyId = n.extended?.accessKeyId;
          if (n.telUrl && n.trunk?.name && typeof accessKeyId === "string")
            next.set(`${accessKeyId} ${n.telUrl}`, n.trunk.name);
        }
        if (!res.nextPageToken || res.nextPageToken === pageToken) break;
        pageToken = res.nextPageToken;
      }
      trunks = next;
      loadedAt = now();
    })().finally(() => (loading = undefined)));

  return async (accessKeyId, e164) => {
    if (!accessKeyId || !e164) return undefined;
    const key = `${accessKeyId} tel:${e164}`;
    const age = now() - loadedAt;
    if (age >= ttlMs || (!trunks.has(key) && age >= missMs)) await load();
    return trunks.get(key);
  };
}

export { createTrunkOfNumber, TrunkNumbersLister, TrunkOfNumber };
