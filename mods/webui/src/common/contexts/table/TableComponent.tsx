import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getSortedRowModel,
  SortingState
} from "@tanstack/react-table";
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
  styled,
  tableCellClasses,
  Box
} from "@mui/material";
import classNames from "classnames";
import { useTableContext } from "./useTableContext";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    // fontWeight: 600,
    fontSize: "0.800rem",
    borderBottom: "1px solid #E9ECEF"
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
    borderBottom: "1px solid rgba(233, 236, 239, 0.5)"
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.background.default
  },
  "&:hover": {
    backgroundColor: "#F8F9FA"
  },
  "&:last-child td, &:last-child th": {
    borderBottom: 0
  }
}));

const StyledTableSortLabel = styled(TableSortLabel)(({ theme }) => ({
  "& .MuiTableSortLabel-icon": {
    opacity: 1,
    color: theme.palette.text.secondary,
    // width: '12px',
    // height: '12px',
    marginLeft: "4px"
  },
  "&.Mui-active": {
    color: theme.palette.text.primary,
    "& .MuiTableSortLabel-icon": {
      color: theme.palette.text.primary,
      opacity: 1
      // width: '12px',
      // height: '12px'
    }
  }
}));

const StyledTableContainer = styled(TableContainer)({
  boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.12)",
  borderRadius: "8px",
  border: "1px solid #E9ECEF",
  "& .MuiTable-root": {
    borderCollapse: "separate",
    borderSpacing: "0"
  }
});

interface MyDataType {
  name: string;
  domainURI: string;
  egressRules: string;
  [key: string]: any;
}

interface MyTableProps {
  id: string;
  data: MyDataType[];
  columns: ColumnDef<MyDataType, any>[];
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string;
  loadingData?: boolean;
}

interface TableOptions {
  filtersDirection: "up" | "down" | undefined;
}

interface TableComponentProps<TData extends Object> {
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  bodyClassName?: string;
  options?: TableOptions;
  id: string;
}

const SortIcon = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginLeft: "4px"
      }}
    >
      <KeyboardArrowUpIcon sx={{ fontSize: 15, marginBottom: -0.5 }} />
      <KeyboardArrowDownIcon sx={{ fontSize: 15, marginTop: -0.5 }} />
    </Box>
  );
};

const TableComponent = <TData extends Object>({
  id,
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  options
}: TableComponentProps<TData>) => {
  const { table, loadingData } = useTableContext<TData>();

  return (
    <StyledTableContainer>
      <Paper elevation={0}>
        <MUITable
          id={`table-${id}`}
          className={classNames(tableClassName, loadingData ? "loading" : "")}
          sx={{ borderRadius: "8px" }}
          size="small"
        >
          <TableHead className={headerClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <StyledTableCell key={header.id} align="left">
                    <StyledTableSortLabel
                      active={header.column.getIsSorted() !== false}
                      direction={
                        header.column.getIsSorted() === "desc" ? "desc" : "asc"
                      }
                      onClick={header.column.getToggleSortingHandler()}
                      IconComponent={
                        header.column.getIsSorted() === false
                          ? () => <SortIcon />
                          : header.column.getIsSorted() === "desc"
                            ? KeyboardArrowDownIcon
                            : KeyboardArrowUpIcon
                      }
                    >
                      {header.column.columnDef.header ? (
                        flexRender(header.column.columnDef.header, {
                          column: header.column,
                          table,
                          header
                        })
                      ) : (
                        <span>{header.id}</span>
                      )}
                    </StyledTableSortLabel>
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody className={classNames(bodyClassName)}>
            {table.getRowModel().rows.map((row, i) => (
              <StyledTableRow key={row.id} className={classNames(rowClassName)}>
                {row.getVisibleCells().map((cell) => (
                  <StyledTableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </StyledTableCell>
                ))}
              </StyledTableRow>
            ))}
          </TableBody>
        </MUITable>
      </Paper>
    </StyledTableContainer>
  );
};

export default TableComponent;
