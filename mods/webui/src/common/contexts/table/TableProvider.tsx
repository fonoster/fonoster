import React, { createContext, useCallback, useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  Table,
  TableState,
  Updater,
  Row,
  ColumnFiltersState,
  SortingState,
  TableOptionsResolved,
  RowModel,
  Column,
  HeaderGroup
} from "@tanstack/react-table";

export interface PaginationProps {
  totalPages?: number;
  pageIndex?: number;
  pageSize?: number;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
  nextPage?: () => void;
  previousPage?: () => void;
  lastPage?: () => void;
  firstPage?: () => void;
  gotoPage?: (updater: Updater<number>) => void;
  setPageSize?: (updater: Updater<number>) => void;
  setNextPageCursor?: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPrevPageCursor?: React.Dispatch<React.SetStateAction<string | undefined>>;
  nextPageCursor?: string | undefined;
  prevPageCursor?: string | undefined;
  pageCount?: number;
}

export interface FilterProps {
  filters?: ColumnFiltersState;
  sortBy?: SortingState;
  globalFilter?: string;
  setGlobalFilter?: (updater: Updater<any>) => void;
}

export interface FonosterResponse<TData> {
  items?: TData[];
  nextPageToken?: string;
  prevPageToken?: string;
  recordTotal?: number;
}

export interface TableContextProps<TData>
  extends Object,
    PaginationProps,
    FilterProps {
  reset: () => void;
  getState: () => TableState;
  setState: (updater: Updater<TableState>) => void;
  tableOptions: TableOptionsResolved<TData>;
  setOptions: (updater: Updater<TableOptionsResolved<TData>>) => void;
  getCoreRowModel: () => RowModel<TData>;
  getAllColumns: () => Column<TData, unknown>[];
  getColumn: (columnId: string) => Column<TData, unknown> | undefined;
  columnFilters: ColumnFiltersState;
  setColumnFilters: (updater: Updater<ColumnFiltersState>) => void;
  getHeaderGroups: () => HeaderGroup<TData>[];
  getFooterGroups: () => HeaderGroup<TData>[];
  headers: ColumnDef<TData, any>[];
  headerGroups: HeaderGroup<TData>[];
  rows: Row<TData>[];
  table: Table<TData>;
  sortBy: { id: string; desc: boolean }[];
  loadingData: boolean;
  setLoadingData: React.Dispatch<React.SetStateAction<boolean>>;
  setData: React.Dispatch<React.SetStateAction<TData[]>>;
  data: TData[];
  fonosterResponse: FonosterResponse<TData> | undefined;
  handleFonosterResponse: (
    response: FonosterResponse<TData> | undefined
  ) => void;
}

const TableContext = createContext<TableContextProps<any> | undefined>(
  undefined
);

export function TableProvider<TData>({
  children,
  columns,
  pagination = true,
  perPage = 10,
  initialState = {},
  enableColumnFilters = true,
  manualFiltering = true,
  manualSorting = true
}: {
  children: React.ReactNode;
  columns: ColumnDef<TData>[];
  pagination?: boolean;
  perPage?: number;
  initialState?: Partial<TableState>;
  enableColumnFilters?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
}) {
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<TData[]>([]);
  const [fonosterResponse, setFonosterResponse] = useState<
    FonosterResponse<TData> | undefined
  >(undefined);
  const [prevPageCursor, setPrevPageCursor] = useState<string | undefined>(
    undefined
  );
  const [nextPageCursor, setNextPageCursor] = useState<string | undefined>(
    undefined
  );

  const table = useReactTable<TData>({
    columns,
    data,
    enableColumnFilters,
    initialState: {
      pagination: initialState.pagination || {
        pageIndex: 0,
        pageSize: perPage
      },
      columnFilters: initialState.columnFilters || [],
      sorting: initialState.sorting || []
    },
    autoResetPageIndex: false,
    manualFiltering,
    manualSorting,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    debugTable: false
  });

  const columnFilters = table.getState().columnFilters;
  const pageIndex = table.getState().pagination.pageIndex;

  useEffect(() => {
    table.resetPageIndex();
  }, [columnFilters]);

  useEffect(() => {
    if (data.length > 0) {
      // Ensure the table state is updated with the new data
      table.setOptions((prev) => ({
        ...prev,
        data: [...data] // Create a new array reference to force update
      }));
    }
  }, [data, table]);

  useEffect(() => {
    if (fonosterResponse) {
      // Make sure pagination state is correctly set
      table.setPagination({
        pageIndex: table.getState().pagination.pageIndex,
        pageSize: table.getState().pagination.pageSize
      });
    }
  }, [fonosterResponse, table]);

  const handleFonosterResponse = useCallback(
    (response: FonosterResponse<TData> | undefined) => {
      // Store the current page token before updating with the new response
      // This will be used as the previous page token when navigating forward
      const currentToken = fonosterResponse?.nextPageToken;

      // Only update if we have a valid response
      if (response) {
        // First set the data to ensure it's available for the table
        const newData = response.items || [];

        // Important: Create a new array reference to force React to detect the change
        setData([...newData]);

        // Store tokens for debugging
        const responseNextToken = response.nextPageToken;
        const responsePrevToken = response.prevPageToken;

        // Create a new fonosterResponse object with the correct tokens
        const updatedResponse = {
          ...response,
          nextPageToken: responseNextToken,
          // If the response already has a prevPageToken, use it
          // Otherwise, use the stored token from the previous response
          prevPageToken:
            responsePrevToken || (pageIndex > 0 ? currentToken : undefined)
        };

        // Update the fonosterResponse with the new object
        setFonosterResponse(updatedResponse);

        // Force table to update with the new data immediately
        table.setOptions((prev) => ({
          ...prev,
          data: [...newData],
          recordTotal: response.recordTotal
        }));
      }
    },
    [fonosterResponse, pageIndex, table]
  );

  return (
    <TableContext.Provider
      value={{
        table,
        totalPages: table.getPageCount(),
        pageIndex: table.getState().pagination.pageIndex,
        pageSize: table.getState().pagination.pageSize,
        sortBy: table.getState().sorting,
        reset: table.reset,
        getState: table.getState,
        setState: table.setState,
        tableOptions: table.options,
        setOptions: table.setOptions,
        getCoreRowModel: table.getCoreRowModel,
        getAllColumns: table.getAllColumns,
        getColumn: table.getColumn,
        getHeaderGroups: table.getHeaderGroups,
        getFooterGroups: table.getFooterGroups,
        columnFilters: table.getState().columnFilters,
        setColumnFilters: table.setColumnFilters,
        headers: table.options.columns,
        headerGroups: table.getHeaderGroups(),
        rows: table.getRowModel().rows,
        setPageSize: (updater: number | ((old: number) => number)) =>
          table.setPageSize(updater),
        filters: table.getState().columnFilters,
        globalFilter: table.getState().globalFilter,
        setGlobalFilter: table.setGlobalFilter,
        canPreviousPage: table.getCanPreviousPage(),
        canNextPage: table.getCanNextPage(),
        nextPage: table.nextPage,
        previousPage: table.previousPage,
        gotoPage: table.setPageIndex,
        firstPage: table.firstPage,
        lastPage: table.lastPage,
        loadingData,
        setLoadingData,
        setData,
        data: table.options.data,

        // External Cursor API handlers
        fonosterResponse,
        handleFonosterResponse,
        nextPageCursor,
        setNextPageCursor,
        prevPageCursor,
        setPrevPageCursor
      }}
    >
      {children}
    </TableContext.Provider>
  );
}
export default TableContext;
