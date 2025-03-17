import { useCallback, useEffect, ReactNode } from "react";
import { useTableContext } from "./useTableContext";
import { FonosterResponse } from "./TableProvider";

interface QueryDataProps<TData, TParams = any> {
  fetchFunction: (
    params: TParams
  ) => Promise<FonosterResponse<TData> | undefined>;
  pageSize?: number;
  initialParams?: Partial<TParams>;
  onFetchStart?: () => void;
  onFetchComplete?: (response: FonosterResponse<TData> | undefined) => void;
  children?: ReactNode;
}

export function useQueryData<TData, TParams = any>({
  fetchFunction,
  pageSize = 10,
  initialParams = {},
  onFetchStart,
  onFetchComplete
}: QueryDataProps<TData, TParams>) {
  const {
    setLoadingData,
    handleFonosterResponse,
    nextPageCursor,
    prevPageCursor,
    globalFilter,
    filters: columnFilters
  } = useTableContext<TData>();

  useEffect(() => {
    handleFetch(undefined);
  }, [globalFilter, columnFilters]);

  // Next page
  useEffect(() => {
    if (nextPageCursor === undefined) return;
    handleFetch(nextPageCursor);
  }, [nextPageCursor]);

  // Previous page
  useEffect(() => {
    if (prevPageCursor === undefined) return;
    handleFetch(prevPageCursor);
  }, [prevPageCursor]);

  const constructFilters = useCallback(() => {
    const filters: Record<string, string> = {};

    // Add property filter if exists
    if (columnFilters && columnFilters.length > 0) {
      const currentFilter = columnFilters[0];
      if (currentFilter?.id && typeof currentFilter.value === "string") {
        filters[currentFilter.id] = globalFilter as string;
      }
    }

    // Add global filter if exists
    if (globalFilter && typeof globalFilter === "string") {
      // If there's no property filter, use a default property
      if (!columnFilters || columnFilters.length === 0) {
        filters["query"] = globalFilter;
      } else {
        // Use the property from columnFilters
        const propertyId = columnFilters[0]?.id;
        if (propertyId) {
          filters[propertyId] = globalFilter;
        }
      }
    }

    return filters;
  }, [globalFilter, columnFilters]);

  const handleFetch = useCallback(
    async (pageToken: string | undefined) => {
      setLoadingData(true);
      if (onFetchStart) onFetchStart();

      const filters = constructFilters();

      const params = {
        ...initialParams,
        pageSize,
        pageToken,
        filterBy: filters
      } as TParams;

      const response = await fetchFunction(params);
      handleFonosterResponse(response);

      if (onFetchComplete) onFetchComplete(response);
      setLoadingData(false);
    },
    [
      fetchFunction,
      initialParams,
      pageSize,
      setLoadingData,
      handleFonosterResponse,
      onFetchStart,
      onFetchComplete,
      constructFilters
    ]
  );

  return { handleFetch };
}

/**
 * A reusable component for handling data fetching and pagination logic for tables.
 * This component can be used directly in JSX to fetch data for a table.
 *
 * Example usage:
 * ```tsx
 * <QueryData<TrunkDTO>
 *   fetchFunction={listTrunks}
 *   pageSize={10}
 * />
 * ```
 */
export function QueryData<TData, TParams = any>({
  fetchFunction,
  pageSize = 10,
  initialParams = {},
  onFetchStart,
  onFetchComplete,
  children
}: QueryDataProps<TData, TParams>) {
  useQueryData<TData, TParams>({
    fetchFunction,
    pageSize,
    initialParams,
    onFetchStart,
    onFetchComplete
  });

  return children ? <>{children}</> : null;
}
