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
/** A Number as Routr's listNumbers has it: its telUrl, its trunk and its workspace. */
type RoutrNumber = {
  telUrl?: string;
  trunk?: { name?: string } | null;
  extended?: Record<string, unknown> | null;
};

/** Routr's Numbers API (the Routr SDK's Numbers), as far as listing goes. */
type NumbersLister = {
  listNumbers(request: {
    pageSize: number;
    pageToken?: string;
  }): Promise<{ items?: RoutrNumber[]; nextPageToken?: string }>;
};

const PAGE_SIZE = 200;
const MAX_PAGES = 100;

/**
 * Pages through Routr's Numbers until `visit` returns true, and says whether it did. Routr has no
 * lookup by telUrl in its API, so whoever needs a Number by telUrl lists them.
 */
async function someRoutrNumber(
  numbers: NumbersLister,
  visit: (n: RoutrNumber) => boolean | void
): Promise<boolean> {
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await numbers.listNumbers({ pageSize: PAGE_SIZE, pageToken });
    for (const n of res.items ?? []) if (visit(n)) return true;
    if (!res.nextPageToken || res.nextPageToken === pageToken) return false;
    pageToken = res.nextPageToken;
  }
  return false;
}

export { NumbersLister, RoutrNumber, someRoutrNumber };
