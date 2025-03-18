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
    prevPageCursor,
    globalFilter,
    filters: columnFilters
  } = useTableContext<TData>();

  // Control de estado local para evitar bucles infinitos
  const [isInitialized, setIsInitialized] = useState(false);
  const isFetchingRef = useRef(false);
  const prevFiltersRef = useRef({ globalFilter, columnFilters });
  const prevCursorsRef = useRef({ nextPageCursor, prevPageCursor });

  // Función para comparar si los filtros han cambiado realmente
  const haveFiltersChanged = useCallback(() => {
    const oldFilters = prevFiltersRef.current;
    const newFilters = { globalFilter, columnFilters };

    const oldGlobalFilter = oldFilters.globalFilter;
    const oldColumnFilters = oldFilters.columnFilters;

    // Comparar globalFilter
    if (oldGlobalFilter !== newFilters.globalFilter) {
      return true;
    }

    // Comparar columnFilters
    if (oldColumnFilters?.length !== newFilters.columnFilters?.length) {
      return true;
    }

    // Comparar cada filtro individual
    for (let i = 0; i < (oldColumnFilters?.length || 0); i++) {
      if (oldColumnFilters?.[i]?.id !== newFilters?.columnFilters?.[i]?.id ||
        oldColumnFilters?.[i]?.value !== newFilters?.columnFilters?.[i]?.value) {
        return true;
      }
    }

    return false;
  }, [globalFilter, columnFilters]);

  // Inicialización - solo se ejecuta una vez
  useEffect(() => {
    if (!isInitialized && !isFetchingRef.current) {
      setIsInitialized(true);
      handleFetch(undefined);
    }
  }, [isInitialized]);

  // Efecto para filtros
  useEffect(() => {
    if (!isInitialized) return;

    if (!isFetchingRef.current && haveFiltersChanged()) {
      prevFiltersRef.current = { globalFilter, columnFilters };
      handleFetch(undefined);
    }
  }, [globalFilter, columnFilters, haveFiltersChanged, isInitialized]);

  // Efecto para cursores de paginación
  useEffect(() => {
    if (!isInitialized) return;

    const oldCursors = prevCursorsRef.current;
    const newCursors = { nextPageCursor, prevPageCursor };

    // Solo ejecutar si los cursores han cambiado
    if (oldCursors.nextPageCursor !== newCursors.nextPageCursor &&
      newCursors.nextPageCursor !== undefined) {
      prevCursorsRef.current = newCursors;
      if (!isFetchingRef.current) {
        handleFetch(nextPageCursor);
      }
    } else if (oldCursors.prevPageCursor !== newCursors.prevPageCursor &&
      newCursors.prevPageCursor !== undefined) {
      prevCursorsRef.current = newCursors;
      if (!isFetchingRef.current) {
        handleFetch(prevPageCursor);
      }
    }
  }, [nextPageCursor, prevPageCursor, isInitialized]);

  const constructFilters = useCallback(() => {
    const filters: Record<string, string> = {};

    // Add property filter if exists
    if (columnFilters && columnFilters.length > 0) {
      const currentFilter = columnFilters[0];
      if (currentFilter?.id && typeof currentFilter.value === 'string') {
        filters[currentFilter.id] = globalFilter as string;
      }
    }

    // Add global filter if exists
    if (globalFilter && typeof globalFilter === 'string') {
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
      // Evitar múltiples peticiones simultáneas
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setLoadingData(true);
      if (onFetchStart) onFetchStart();

      try {
        const filters = constructFilters();

        const params = {
          ...initialParams,
          pageSize,
          pageToken,
          filterBy: filters
        } as TParams;

        const response = await fetchFunction(params);

        // Solo actualizar si la respuesta es válida
        if (response) {
          handleFonosterResponse(response);
          if (onFetchComplete) onFetchComplete(response);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        // Usar setTimeout para asegurar que estas actualizaciones
        // no se ejecuten en el mismo ciclo de renderizado
        setTimeout(() => {
          setLoadingData(false);
          isFetchingRef.current = false;
        }, 0);
      }
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
  // Usar el hook sin efectos secundarios directos
  const { handleFetch } = useQueryData<TData, TParams>({
    fetchFunction,
    pageSize,
    initialParams,
    onFetchStart,
    onFetchComplete
  });

  // Efecto de inicialización - solo se ejecuta una vez al montar
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
    }
    // No incluir handleFetch en las dependencias para evitar re-ejecuciones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children ? <>{children}</> : null;
}
