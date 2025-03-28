import { useCallback, useEffect, ReactNode, useRef, useState } from "react";
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
    setNextPageCursor,
    prevPageCursor,
    setPrevPageCursor,
    globalFilter,
    filters: columnFilters,
    sortBy,
    pageIndex = 0
  } = useTableContext<TData>();

  console.log("useQueryData", { globalFilter, columnFilters, sortBy, pageIndex });

  // Local state control to avoid infinite loops
  const [isInitialized, setIsInitialized] = useState(false);
  const isFetchingRef = useRef(false);
  const prevFiltersRef = useRef({ globalFilter, columnFilters });
  const prevSortByRef = useRef(sortBy);
  const prevCursorsRef = useRef({ nextPageCursor, prevPageCursor });

  // Store a history of tokens to facilitate bidirectional navigation
  const tokensHistoryRef = useRef<{
    [key: number]: { next?: string; prev?: string };
  }>({});
  const prevPageIndexRef = useRef<number>(0);

  // Function to compare if filters have actually changed
  const haveFiltersChanged = useCallback(() => {
    const oldFilters = prevFiltersRef.current;
    const newFilters = { globalFilter, columnFilters };

    const oldGlobalFilter = oldFilters.globalFilter;
    const oldColumnFilters = oldFilters.columnFilters;

    // Compare globalFilter
    if (oldGlobalFilter !== newFilters.globalFilter) {
      return true;
    }

    // Compare columnFilters
    if (oldColumnFilters?.length !== newFilters.columnFilters?.length) {
      return true;
    }

    // Compare each individual filter
    for (let i = 0; i < (oldColumnFilters?.length || 0); i++) {
      if (
        oldColumnFilters?.[i]?.id !== newFilters?.columnFilters?.[i]?.id ||
        oldColumnFilters?.[i]?.value !== newFilters?.columnFilters?.[i]?.value
      ) {
        return true;
      }
    }

    return false;
  }, [globalFilter, columnFilters]);

  // Function to compare if sorting has changed
  const hasSortingChanged = useCallback(() => {
    const oldSortBy = prevSortByRef.current;
    console.log("Checking sort change - Current:", sortBy, "Previous:", oldSortBy);

    // Compare length
    if ((oldSortBy?.length || 0) !== (sortBy?.length || 0)) {
      console.log("Sort length changed");
      return true;
    }

    // Compare each sort criteria
    for (let i = 0; i < (sortBy?.length || 0); i++) {
      if (
        oldSortBy?.[i]?.id !== sortBy?.[i]?.id ||
        oldSortBy?.[i]?.desc !== sortBy?.[i]?.desc
      ) {
        console.log("Sort criteria changed at index", i);
        return true;
      }
    }

    return false;
  }, [sortBy]);

  // Initialization - only runs once
  useEffect(() => {
    if (!isInitialized && !isFetchingRef.current) {
      setIsInitialized(true);
      handleFetch(undefined);
    }
  }, [isInitialized]);

  // Effect for filters
  useEffect(() => {
    if (!isInitialized) return;

    if (!isFetchingRef.current && haveFiltersChanged()) {
      prevFiltersRef.current = { globalFilter, columnFilters };
      // Reset token history when filters change
      tokensHistoryRef.current = {};
      prevPageIndexRef.current = 0;
      handleFetch(undefined);
    }
  }, [globalFilter, columnFilters, haveFiltersChanged, isInitialized]);

  // Effect for sorting
  useEffect(() => {
    if (!isInitialized) return;

    console.log("sortBy changed in effect:", sortBy);
    
    if (!isFetchingRef.current) {
      // Check if sorting has actually changed to avoid unnecessary fetches
      if (hasSortingChanged()) {
        console.log("Sorting changed, updating reference and fetching data");
        prevSortByRef.current = sortBy;
        // Reset token history when sorting changes
        tokensHistoryRef.current = {};
        prevPageIndexRef.current = 0;
        handleFetch(undefined);
      } else {
        console.log("Sorting state received but no actual change detected");
      }
    } else {
      console.log("Fetch already in progress, skipping sort change handling");
    }
  }, [sortBy, hasSortingChanged, isInitialized]);

  // Effect to detect changes in page index
  useEffect(() => {
    if (!isInitialized) return;

    // If pageIndex has changed and setNextPageCursor/setPrevPageCursor are defined
    if (
      pageIndex !== prevPageIndexRef.current &&
      setNextPageCursor &&
      setPrevPageCursor
    ) {
      const direction = pageIndex > prevPageIndexRef.current ? "next" : "prev";

      // Determine which token to use based on direction and history
      let tokenToUse: string | undefined = undefined;

      if (direction === "next") {
        // Moving to the next page
        tokenToUse = tokensHistoryRef.current[prevPageIndexRef.current]?.next;
        if (tokenToUse) {
          setNextPageCursor(tokenToUse);
        }
      } else {
        // Moving back to the previous page
        tokenToUse = tokensHistoryRef.current[prevPageIndexRef.current]?.prev;
        if (tokenToUse) {
          setPrevPageCursor(tokenToUse);
        }
      }

      // Update previous page index
      prevPageIndexRef.current = pageIndex;
    }
  }, [pageIndex, isInitialized, setNextPageCursor, setPrevPageCursor]);

  // Effect for pagination cursors
  useEffect(() => {
    if (!isInitialized) return;

    const oldCursors = prevCursorsRef.current;
    const newCursors = { nextPageCursor, prevPageCursor };

    // Only execute if cursors have changed
    if (
      oldCursors.nextPageCursor !== newCursors.nextPageCursor &&
      newCursors.nextPageCursor !== undefined
    ) {
      prevCursorsRef.current = newCursors;
      if (!isFetchingRef.current) {
        // Save token in history
        if (pageIndex !== undefined) {
          tokensHistoryRef.current[pageIndex] = {
            ...tokensHistoryRef.current[pageIndex],
            next: nextPageCursor
          };
        }
        handleFetch(nextPageCursor);
      }
    } else if (
      oldCursors.prevPageCursor !== newCursors.prevPageCursor &&
      newCursors.prevPageCursor !== undefined
    ) {
      prevCursorsRef.current = newCursors;
      if (!isFetchingRef.current) {
        // Save token in history
        if (pageIndex !== undefined) {
          tokensHistoryRef.current[pageIndex] = {
            ...tokensHistoryRef.current[pageIndex],
            prev: prevPageCursor
          };
        }
        handleFetch(prevPageCursor);
      }
    }
  }, [nextPageCursor, prevPageCursor, isInitialized, pageIndex]);

  const constructFilters = useCallback(() => {
    // Object individual filters
    const filterValues: Record<string, string> = {};

    // GEt columnFilters values
    if (columnFilters && columnFilters.length > 0) {
      const currentFilter = columnFilters[0];

      // IF there are a column ID and a value
      if (
        currentFilter?.id &&
        currentFilter.value &&
        typeof currentFilter.value === "string" &&
        currentFilter.value.trim() !== ""
      ) {
        // Add filter to the filter objects
        filterValues[currentFilter.id] = currentFilter.value;
      }
    }
    // Compatibility case: if there is not a column filter but there is a global filter
    else if (
      globalFilter &&
      typeof globalFilter === "string" &&
      globalFilter.trim() !== ""
    ) {
      filterValues["query"] = globalFilter;
    }

    // Build parameters final object
    const filters: Record<string, any> = {};

    // Only add filterBy if there are some one
    if (Object.keys(filterValues).length > 0) {
      filters.filterBy = filterValues;
    }

    return filters;
  }, [globalFilter, columnFilters]);

  const constructSorting = useCallback(() => {
    // Build sorting parameters
    const sortingParams: Record<string, any> = {};

    if (sortBy && sortBy.length > 0) {
      // Convert the sortBy array to the format expected by the API
      const sortingValues = sortBy.map(sort => ({
        field: sort.id,
        order: sort.desc ? 'DESC' : 'ASC'
      }));

      sortingParams.sortBy = sortingValues;
      console.log("Constructed sorting parameters:", sortingParams);
    }

    return sortingParams;
  }, [sortBy]);

  const handleFetch = useCallback(
    async (pageToken: string | undefined) => {
      // Avoid multiple simultaneous requests
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setLoadingData(true);
      if (onFetchStart) onFetchStart();

      try {
        const filters = constructFilters();
        const sorting = constructSorting();

        const params = {
          ...initialParams,
          pageSize,
          pageToken,
          ...filters,
          ...sorting
        } as unknown as TParams;

        console.log("Making API request with params:", JSON.stringify(params, null, 2));

        const response = await fetchFunction(params);
        console.log("API response received:", response);

        // Update token history with the response
        if (response && pageIndex !== undefined) {
          tokensHistoryRef.current[pageIndex] = {
            ...tokensHistoryRef.current[pageIndex],
            next: response.nextPageToken,
            prev: response.prevPageToken
          };

          // If we're moving to a new page, save the previous token for the next page
          if (
            pageToken === nextPageCursor &&
            pageIndex + 1 < Object.keys(tokensHistoryRef.current).length
          ) {
            tokensHistoryRef.current[pageIndex + 1] = {
              ...tokensHistoryRef.current[pageIndex + 1],
              prev: response.nextPageToken
            };
          }

          // If we're moving back, save the next token for the previous page
          if (pageToken === prevPageCursor && pageIndex - 1 >= 0) {
            tokensHistoryRef.current[pageIndex - 1] = {
              ...tokensHistoryRef.current[pageIndex - 1],
              next: response.prevPageToken
            };
          }
        }

        handleFonosterResponse(response);
        if (onFetchComplete) onFetchComplete(response);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
        isFetchingRef.current = false;
      }
    },
    [
      initialParams,
      pageSize,
      constructFilters,
      constructSorting,
      fetchFunction,
      handleFonosterResponse,
      onFetchComplete,
      onFetchStart,
      setLoadingData,
      pageIndex,
      nextPageCursor,
      prevPageCursor
    ]
  );

  return { handleFetch };
}

export function QueryData<TData, TParams = any>({
  fetchFunction,
  pageSize = 10,
  initialParams = {},
  onFetchStart,
  onFetchComplete,
  children
}: QueryDataProps<TData, TParams>) {
  useQueryData({
    fetchFunction,
    pageSize,
    initialParams,
    onFetchStart,
    onFetchComplete
  });

  return <>{children}</>;
}

export default QueryData;
