import { useCallback, useEffect, ReactNode } from "react";
import { useTableContext } from "./useTableContext";
import { FonosterResponse } from "./TableProvider";

interface QueryDataProps<TData, TParams = any> {
  fetchFunction: (params: TParams) => Promise<FonosterResponse<TData> | undefined>;
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
    prevPageCursor 
  } = useTableContext<TData>();

  useEffect(() => {
    handleFetch(undefined);
  }, []);

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

  const handleFetch = useCallback(async (pageToken: string | undefined) => {
    setLoadingData(true);
    if (onFetchStart) onFetchStart();
    
    const params = {
      ...initialParams,
      pageSize,
      pageToken
    } as TParams;
    
    const response = await fetchFunction(params);
    handleFonosterResponse(response);
    
    if (onFetchComplete) onFetchComplete(response);
    setLoadingData(false);
  }, [fetchFunction, initialParams, pageSize, setLoadingData, handleFonosterResponse, onFetchStart, onFetchComplete]);

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