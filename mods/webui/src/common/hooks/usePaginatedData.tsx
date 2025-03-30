import { useState, useCallback } from "react";

interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
  prevPageToken?: string;
  recordTotal?: number;
}

interface PaginatedRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
  sortBy?: Array<{ field: string; order: "ASC" | "DESC" }>;
}

interface UsePaginatedDataOptions<T> {
  generateFakeData: (index: number) => T;
  totalItems?: number;
  defaultPageSize?: number;
}

export const usePaginatedData = <T extends Record<string, any>>(
  options: UsePaginatedDataOptions<T>
) => {
  const { generateFakeData, totalItems = 30, defaultPageSize = 10 } = options;

  const [allItems] = useState(() =>
    Array.from({ length: totalItems }).map((_, index) =>
      generateFakeData(index)
    )
  );

  const listItems = useCallback(
    async (
      payload: PaginatedRequest = {
        pageSize: defaultPageSize,
        pageToken: undefined
      }
    ): Promise<PaginatedResponse<T>> => {
      // Apply filters if they exist
      let filteredItems = [...allItems];

      // Apply filterBy if it exists
      if (payload.filterBy) {
        Object.entries(payload.filterBy).forEach(([key, value]) => {
          if (value) {
            filteredItems = filteredItems.filter((item) => {
              const itemValue = item[key];
              if (typeof itemValue === "string") {
                return itemValue.toLowerCase().includes(value.toLowerCase());
              }
              return false;
            });
          }
        });
      }

      // Apply sortBy if it exists
      if (payload.sortBy && payload.sortBy.length > 0) {
        filteredItems = filteredItems.sort((a, b) => {
          for (const { field, order } of payload.sortBy || []) {
            const aValue = a[field];
            const bValue = b[field];

            if (aValue < bValue) {
              return order === "ASC" ? -1 : 1;
            }
            if (aValue > bValue) {
              return order === "ASC" ? 1 : -1;
            }
          }
          return 0;
        });
      }

      // Get pagination parameters
      const pageSize = payload.pageSize || defaultPageSize;
      const pageToken = payload.pageToken;

      // Calculate total records after filtering
      const recordTotal = filteredItems.length;

      // Determine the starting index based on the cursor token
      let startIndex = 0;
      if (pageToken) {
        const tokenParts = pageToken.split("-");
        if (tokenParts.length === 2) {
          startIndex = parseInt(tokenParts[1], 10);
        }
      }

      // Get the current page of items
      const endIndex = Math.min(startIndex + pageSize, filteredItems.length);
      const pageItems = filteredItems.slice(startIndex, endIndex);

      // Determine if there are more pages
      const hasNextPage = endIndex < filteredItems.length;
      const hasPrevPage = startIndex > 0;

      // Create the next page token if there are more pages
      const nextPageToken = hasNextPage ? `cursor-${endIndex}` : undefined;

      // Create the previous page token if we're not on the first page
      const prevPageToken = hasPrevPage
        ? `cursor-${Math.max(0, startIndex - pageSize)}`
        : undefined;

      return {
        items: pageItems,
        nextPageToken,
        prevPageToken,
        recordTotal
      };
    },
    [allItems, defaultPageSize]
  );

  return { listItems };
};
