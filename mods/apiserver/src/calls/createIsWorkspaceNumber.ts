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
/** One page of Routr's numbers (the Routr SDK's listNumbers). */
type NumbersPage = {
  items?: { telUrl?: string; extended?: Record<string, unknown> | null }[];
  nextPageToken?: string;
};

type NumbersLister = {
  listNumbers(request: {
    pageSize: number;
    pageToken?: string;
  }): Promise<NumbersPage>;
};

/** Whether `e164` (CreateCall's `from`) is a Number of the workspace `accessKeyId`. */
type IsWorkspaceNumber = (
  accessKeyId: string,
  e164: string
) => Promise<boolean>;

const PAGE_SIZE = 200;
const MAX_PAGES = 100;

/**
 * CreateCall's `from` becomes X-Dod-Number, which Routr uses to pick the Number's trunk, so it
 * must be one of the caller's own Numbers (security review C2). Routr has no lookup by telUrl in
 * its API, so this pages through the Numbers and matches `tel:<from>` and the workspace.
 */
function createIsWorkspaceNumber(numbers: NumbersLister): IsWorkspaceNumber {
  return async (accessKeyId, e164) => {
    if (!accessKeyId || !e164) return false;
    const telUrl = `tel:${e164}`;
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await numbers.listNumbers({ pageSize: PAGE_SIZE, pageToken });
      for (const n of res.items ?? []) {
        if (n.telUrl === telUrl && n.extended?.accessKeyId === accessKeyId)
          return true;
      }
      if (!res.nextPageToken || res.nextPageToken === pageToken) return false;
      pageToken = res.nextPageToken;
    }
    return false;
  };
}

export { createIsWorkspaceNumber, IsWorkspaceNumber, NumbersLister };
