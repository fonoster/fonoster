import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  useRef
} from "react";
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
  RowSelectionState
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
  rowSelection: RowSelectionState;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  getSelectedRowModel: () => RowModel<TData>;
  getIsAllRowsSelected: () => boolean;
  getIsSomeRowsSelected: () => boolean;
  getToggleAllRowsSelectedHandler: () => (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  manualSorting = true,
  enableRowSelection = false
}: {
  children: React.ReactNode;
  columns: ColumnDef<TData>[];
  pagination?: boolean;
  perPage?: number;
  initialState?: Partial<TableState>;
  enableColumnFilters?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
  enableRowSelection?: boolean;
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable<TData>({
    columns,
    data,
    enableColumnFilters,
    enableRowSelection,
    state: {
      pagination: initialState.pagination || {
        pageIndex: 0,
        pageSize: perPage
      },
      columnFilters: initialState.columnFilters || [],
      sorting: initialState.sorting || [],
      rowSelection
    },
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false,
    manualFiltering,
    manualSorting,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
    // Usar un identificador único para cada fila en lugar del índice
    getRowId: (originalRow: any, index: number) => {
      // Intentar usar un campo id o _id si existe en los datos
      if ('id' in originalRow) {
        return String(originalRow.id);
      } else if ('_id' in originalRow) {
        return String(originalRow._id);
      } else if ('ref' in originalRow) {
        return String(originalRow.ref);
      } else {
        // Si no hay un identificador único, usar una combinación de datos para crear uno
        // Esto es una solución de respaldo, es mejor tener un ID único real
        return `${index}-${JSON.stringify(originalRow)}`;
      }
    }
  });

  const columnFilters = table.getState().columnFilters;
  const pageIndex = table.getState().pagination.pageIndex;

  // Usar una referencia para controlar si ya se ha reseteado el índice de página
  const resetPageIndexRef = useRef(false);

  useEffect(() => {
    // Solo resetear si los filtros han cambiado y no estamos en medio de otra actualización
    if (!resetPageIndexRef.current) {
      resetPageIndexRef.current = true;
      // Usar setTimeout para asegurar que esta actualización ocurra en el siguiente ciclo
      setTimeout(() => {
        table.resetPageIndex();
        resetPageIndexRef.current = false;
      }, 0);
    }
  }, [columnFilters, table]);

  // Usar una referencia para prevenir actualizaciones cíclicas
  const dataUpdateRef = useRef(false);

  useEffect(() => {
    if (data.length > 0 && !dataUpdateRef.current) {
      const currentData = table.options.data;
      if (JSON.stringify(currentData) !== JSON.stringify(data)) {
        dataUpdateRef.current = true;
        // Usar setTimeout para romper el ciclo de actualizaciones
        setTimeout(() => {
          table.setOptions((prev) => ({
            ...prev,
            data: [...data]
          }));
          dataUpdateRef.current = false;
        }, 0);
      }
    }
  }, [data, table]);

  useEffect(() => {
    if (fonosterResponse) {
      // Usar setTimeout para evitar actualizaciones en el mismo ciclo de renderizado
      setTimeout(() => {
        table.setPagination({
          pageIndex: table.getState().pagination.pageIndex,
          pageSize: table.getState().pagination.pageSize
        });
      }, 0);
    }
  }, [fonosterResponse, table]);

  // Referencia para controlar el estado de la actualización de la respuesta
  const responseUpdateRef = useRef(false);

  const handleFonosterResponse = useCallback(
    (response: FonosterResponse<TData> | undefined) => {
      // Evitar actualizaciones simultáneas
      if (responseUpdateRef.current) return;
      
      const currentToken = fonosterResponse?.nextPageToken;

      if (response) {
        responseUpdateRef.current = true;
        
        // Ejecutar las actualizaciones en el siguiente ciclo
        setTimeout(() => {
          try {
            const newData = response.items || [];

            const currentData = data;
            if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
              setData([...newData]);
            }

            const responseNextToken = response.nextPageToken;
            const responsePrevToken = response.prevPageToken;

            const updatedResponse = {
              ...response,
              nextPageToken: responseNextToken,
              prevPageToken: responsePrevToken || (pageIndex > 0 ? currentToken : undefined)
            };

            if (JSON.stringify(fonosterResponse) !== JSON.stringify(updatedResponse)) {
              setFonosterResponse(updatedResponse);
            }

            if (JSON.stringify(table.options.data) !== JSON.stringify(newData)) {
              table.setOptions((prev) => ({
                ...prev,
                data: [...newData],
                recordTotal: response.recordTotal
              }));
            }
          } finally {
            responseUpdateRef.current = false;
          }
        }, 0);
      }
    },
    [fonosterResponse, pageIndex, table, data]
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

        rowSelection: table.getState().rowSelection,
        setRowSelection: table.setRowSelection,
        getSelectedRowModel: table.getSelectedRowModel,
        getIsAllRowsSelected: table.getIsAllRowsSelected,
        getIsSomeRowsSelected: table.getIsSomeRowsSelected,
        getToggleAllRowsSelectedHandler: table.getToggleAllRowsSelectedHandler,

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
