import React from "react";
import { flexRender } from "@tanstack/react-table";
import {
  Table as MUITable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
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
    fontSize: "10px",
    lineHeight: "16px",
    fontFamily: "Roboto Mono",
    fontWeight: 500,
    letterSpacing: "5%",
    textTransform: "uppercase"
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: "10px",
    lineHeight: "16px",
    color: theme.palette.text.secondary["700"],
    fontFamily: "Poppins",
    fontWeight: 500,
    paragraphSpacing: "12px",
    letterSpacing: "0%",
    borderBottom: `1px solid ${theme.palette.grey["100"]}`
  },
  padding: "8px 16px",
  height: "13px"
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  "&:hover": {
    backgroundColor: "#F8F9FA"
  }
}));

const StyledTableSortLabel = styled(TableSortLabel)(({ theme }) => ({
  "& .MuiTableSortLabel-icon": {
    opacity: 1,
    color: theme.palette.text.secondary,
    marginLeft: "4px"
  },
  "&.Mui-active": {
    color: theme.palette.text.primary,
    "& .MuiTableSortLabel-icon": {
      color: theme.palette.text.primary,
      opacity: 1
    }
  }
}));

const StyledTableContainer = styled(TableContainer)({
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
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
      <MUITable
        id={`table-${id}`}
        className={classNames(tableClassName, loadingData ? "loading" : "")}
        // size="small"
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
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row, i) => (
              <StyledTableRow key={row.id} className={classNames(rowClassName)}>
                {row.getVisibleCells().map((cell) => (
                  <StyledTableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </StyledTableCell>
                ))}
              </StyledTableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.getAllColumns().length} align="center">
                {loadingData ? "Loading..." : "No data available"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MUITable>
    </StyledTableContainer>
  );
};

export default TableComponent;
