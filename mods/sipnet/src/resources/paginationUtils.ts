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
 * Normalizes empty string nextPageToken from response to undefined.
 */
export function normalizeNextPageToken(
  nextPageToken?: string
): string | undefined {
  return nextPageToken && nextPageToken !== "" ? nextPageToken : undefined;
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
 * Handles pagination with filtering, continuing to fetch pages until:
 * - We have enough items (pageSize)
 * - We run out of pages
 * - We hit the max iterations limit
 *
 * This handles the case where the first pages contain items from other customers.
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

  const normalizedPageToken = normalizePageToken(pageToken);
  const items: TOutput[] = [];
  let nextPageToken: string | undefined;
  let currentPageToken: string | undefined = normalizedPageToken;
  let hasMorePages = true;
  let iterations = 0;

  while (
    items.length < pageSize &&
    hasMorePages &&
    iterations < maxIterations
  ) {
    iterations++;

    // Request more items to account for filtering
    const backendRequestedSize = pageSize * 2;
    const response = await fetchPage(currentPageToken, backendRequestedSize);

    if (!response || !response.items) {
      hasMorePages = false;
      nextPageToken = undefined;
      break;
    }

    const filteredItems = filterItems(response.items);
    items.push(...filteredItems);

    const backendNextPageToken = normalizeNextPageToken(response.nextPageToken);

    // If we got no items from backend or no nextPageToken, we're done
    if (response.items.length === 0 || !backendNextPageToken) {
      hasMorePages = false;
      nextPageToken = undefined;
      break;
    }

    // Check if backend returned fewer items than requested (indicating last page)
    // If backend returned exactly what we asked for or more, there might be more items
    const backendHasMoreItems = response.items.length >= backendRequestedSize;

    // If we've filled the page, we're done
    if (items.length >= pageSize) {
      // We filled the page, so there might be more items
      // Only return nextPageToken if backend indicates there are more items
      nextPageToken = backendHasMoreItems ? backendNextPageToken : undefined;
      break;
    }

    // If we got filtered items in this iteration, return them
    // Only continue if we got 0 filtered items (meaning all items were from other customers)
    if (filteredItems.length === 0) {
      // No items matched in this page, continue to next page
      currentPageToken = backendNextPageToken;
      nextPageToken = backendNextPageToken;
    } else {
      nextPageToken = backendHasMoreItems ? backendNextPageToken : undefined;
      break;
    }
  }

  return {
    items: items.slice(0, pageSize),
    nextPageToken
  };
}
