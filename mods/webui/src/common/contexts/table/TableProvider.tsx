import React, { createContext, useContext, useEffect, useState } from 'react';
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
  HeaderGroup,
} from '@tanstack/react-table';

export interface PaginationProps {
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
  pageCount?: number;
}

export interface FilterProps {
  filters?: ColumnFiltersState;
  sortBy?: SortingState;
  globalFilter?: string;
  setGlobalFilter?: (updater: Updater<any>) => void;
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
}

const TableContext = createContext<TableContextProps<any> | undefined>(undefined);

export function TableProvider<TData>({
  children,
  columns,
  pagination = true,
  perPage = 10,
  initialState = {},
  enableColumnFilters = true,
  manualFiltering = true,
  manualSorting = true,
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
  console.log(data)
  const table = useReactTable<TData>({
    columns,
    data,
    enableColumnFilters,
    initialState: {
      pagination: initialState.pagination || {
        pageIndex: 0,
        pageSize: perPage,
      },
      columnFilters: initialState.columnFilters || [],
      sorting: initialState.sorting || [],
    },
    autoResetPageIndex: false,
    manualFiltering,
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
  });

  const columnFilters = table.getState().columnFilters;

  useEffect(() => {
    table.resetPageIndex();
  }, [columnFilters]);

  return (
    <TableContext.Provider value={{
      table,
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
      setPageSize: (updater: number | ((old: number) => number)) => table.setPageSize(updater),
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
      data: table.options.data
    }}>
      {children}
    </TableContext.Provider>
  );
}
export default TableContext;