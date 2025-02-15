import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import {
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Checkbox,
} from '@mui/material';
import classNames from 'classnames';
import { useTableContext } from './useTableContext';

interface MyDataType {
  name: string;
  domainURI: string;
  egressRules: string;
  [key: string]: any;
}

interface MyTableProps {
  id: string;
  data: MyDataType[];
  columns: ColumnDef<MyDataType, any>[]; // Cambié el tipo de ColumnDef
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string;
  loadingData?: boolean;
}

interface TableOptions {
  filtersDirection: 'up' | 'down' | undefined;
}

interface TableComponentProps<TData extends Object> {
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  bodyClassName?: string;
  options?: TableOptions;
  id: string;
}


const TableComponent = <TData extends Object>({
  id,
  // data,
  // columns,
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  options,
}: TableComponentProps<TData>) => {
  // const [sorting, setSorting] = React.useState<SortingState>([]);

  // const table = useReactTable({
  //   data,
  //   columns,
  //   getCoreRowModel: getCoreRowModel(),
  //   getSortedRowModel: getSortedRowModel(),
  //   onSortingChange: setSorting,
  //   state: {
  //     sorting,
  //   },
  // });

  const { table, loadingData } = useTableContext<TData>();

  const headerStyle = {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  };

  const cellStyle = {
    padding: '8px 16px',
  };

  const rowStyle = {
    borderBottom: '0.5px solid #e0e0e0',
  };

  return (
    <TableContainer component={Paper}>
      <MUITable
        id={`table-${id}`}
        className={classNames(tableClassName, loadingData ? 'loading' : '')}
      >
        <TableHead className={headerClassName}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  style={{ ...headerStyle, ...cellStyle }}
                >
                  <TableSortLabel
                    active={header.column.getIsSorted() !== false}
                    direction={header.column.getIsSorted() === 'desc' ? 'desc' : 'asc'}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.column.columnDef.header ? (
                      flexRender(header.column.columnDef.header, { column: header.column, table, header })
                    ) : (
                      <span>{header.id}</span>
                    )}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody className={classNames(bodyClassName)}>
          {table.getRowModel().rows.map((row, i) => {
            const rowClass = i % 2 === 0 ? 'even' : 'odd';

            return (
              <TableRow
                key={row.id}
                className={classNames(rowClassName, rowClass)}
                style={rowStyle}
              >
                {/* <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                  />
                </TableCell> */}
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} style={cellStyle}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </MUITable>
    </TableContainer>
  );
};

export default TableComponent;