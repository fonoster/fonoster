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
type ListResponse<T> = {
  items: T[];
  nextPageToken?: string;
};

type PaginatedListOptions<TInput, TOutput = TInput> = {
  pageSize: number;
  pageToken?: string;
  fetchPage: (
    pageToken: string | undefined,
    pageSize: number
  ) => Promise<ListResponse<TInput>>;
  filterItems: (items: TInput[]) => TOutput[];
  maxIterations?: number;
};

/**
 * Normalizes empty string pageToken to undefined.
 * Empty strings are falsy in JS, but gRPC/protobuf may send them as empty strings.
 */
export function normalizePageToken(pageToken?: string): string | undefined {
  return pageToken === "" ? undefined : pageToken;
}

/**
 * Normalizes nextPageToken from response; returns empty string when there are no more pages.
 */
export function normalizeNextPageToken(nextPageToken?: string): string {
  return nextPageToken && nextPageToken !== "" ? nextPageToken : "";
}

/**
 * Filters items by accessKeyId from extended field.
 */
export function filterByAccessKeyId<
  T extends { extended?: { accessKeyId?: string } }
>(items: T[], accessKeyId: string): T[] {
  return items.filter((item) => item.extended?.accessKeyId === accessKeyId);
}

/**
 * Pages through Routr's items keeping only the caller's, so that following `nextPageToken` returns
 * every kept item exactly once (management-api, "Lists page through every item once").
 *
 * Routr's page token is a cursor on the last ref it returned, so a page can end on any item: when
 * the page fills in the middle of a backend batch, the token is the ref of the last item kept and
 * the next call resumes right after it. Batches with none of the caller's items are skipped, up to
 * `maxIterations` of them; the token then points past the last batch read.
 *
 * @template TInput - The type of items returned from the API
 * @template TOutput - The type of items after filtering/transformation (defaults to TInput)
 */
export async function paginateWithFiltering<TInput, TOutput = TInput>(
  options: PaginatedListOptions<TInput, TOutput>
): Promise<ListResponse<TOutput>> {
  const {
    pageSize,
    pageToken,
    fetchPage,
    filterItems,
    maxIterations = 10
  } = options;

  const items: TOutput[] = [];
  let cursor = normalizePageToken(pageToken);

  for (let i = 0; i < maxIterations; i++) {
    const requested = pageSize * 2;
    const response = await fetchPage(cursor, requested);
    const batch = response?.items ?? [];
    const next = normalizeNextPageToken(response?.nextPageToken);
    // Routr may answer a token on its last page too: a short batch that had some of the caller's
    // items is the end; a short one with none of them is followed, as before.
    const short = batch.length < requested;
    let kept = 0;

    for (const [index, item] of batch.entries()) {
      const mine = filterItems([item]);
      if (mine.length === 0) continue;
      kept += mine.length;
      items.push(...mine);
      if (items.length >= pageSize) {
        const lastOfAll = (!next || short) && index === batch.length - 1;
        return {
          items,
          nextPageToken: lastOfAll ? "" : ((item as { ref?: string }).ref ?? "")
        };
      }
    }

    if (batch.length === 0 || !next || (short && kept > 0))
      return { items, nextPageToken: "" };
    cursor = next;
  }

  return { items, nextPageToken: cursor ?? "" };
}
