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
import IndeterminateCheckbox from "./checkbox/IndeterminateCheckbox";
import { Typography } from "@stories/typography/Typography";

// Define an interface for the StyledTableCell props
interface StyledTableCellProps {
  enableRowSelection?: boolean;
}

const StyledTableCell = styled(TableCell)<StyledTableCellProps>(({ theme, enableRowSelection }: { theme: any, enableRowSelection?: boolean }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    fontSize: "10px",
    lineHeight: "16px",
    fontFamily: "Poppins",
    fontWeight: 500,
    letterSpacing: "5%"
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: "10px",
    lineHeight: "16px",
    color: theme.palette.text.secondary,
    fontFamily: "Poppins",
    fontWeight: 500,
    paragraphSpacing: "12px",
    letterSpacing: "0%",
    borderBottom: `1px solid ${theme.palette.grey["100"]}`
  },
  padding: "8px 16px",
  height: "13px",
  paddingLeft: enableRowSelection ? "8px" : "16px"
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

export interface TableOptions {
  filtersDirection?: "up" | "down" | undefined;
}

interface TableComponentProps<TData extends Object> {
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  bodyClassName?: string;
  enableRowSelection?: boolean;
  onRowSelection?: (row: TData) => void;
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
  onRowSelection,
  enableRowSelection
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
              {/* Row selection column - empty header cell */}
              {enableRowSelection && (
                <StyledTableCell
                  padding="checkbox"
                  align="center"
                  style={{ width: "48px" }}
                  enableRowSelection={enableRowSelection}
                >
                  {/* Select all checkbox moved to TableHeader.tsx */}
                </StyledTableCell>
              )}
              {headerGroup.headers.map((header) => (
                <StyledTableCell key={header.id} align="left" enableRowSelection={enableRowSelection}>
                  <StyledTableSortLabel
                    active={header.column.getIsSorted() !== false}
                    direction={
                      header.column.getIsSorted() === "desc" ? "desc" : "asc"
                    }
                    onClick={(e) => {
                      table.setSorting(old => {
                        // If this column is already being sorted
                        const existingIndex = old.findIndex(d => d.id === header.id);

                        if (existingIndex > -1) {
                          // Toggle between ascending, descending, and removing
                          const existingSort = old[existingIndex];
                          const newSort = {
                            ...existingSort,
                            desc: !existingSort.desc
                          };
                          return [newSort];
                        }

                        return [{ id: header.id, desc: false }];
                      });

                    }}
                    IconComponent={() => {
                      // Directly check the sorting state for this column
                      const sortDir = header.column.getIsSorted();

                      if (sortDir === false) {
                        return <SortIcon />;
                      } else if (sortDir === "desc") {
                        return <KeyboardArrowDownIcon />;
                      } else {
                        return <KeyboardArrowUpIcon />;
                      }
                    }}
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
              <StyledTableRow
                key={row.id}
                className={classNames(rowClassName)}
                onClick={() => onRowSelection?.(row.original)}
                sx={{ cursor: onRowSelection ? "pointer" : "" }}
              >
                {/* Checkbox to select a row */}
                {enableRowSelection && (
                  <StyledTableCell padding="checkbox" align="center" enableRowSelection={enableRowSelection}>
                    <IndeterminateCheckbox
                      checked={row.getIsSelected()}
                      disabled={!row.getCanSelect()}
                      indeterminate={row.getIsSomeSelected()}
                      onChange={(e) => {
                        // Use a more stable event handler
                        e.stopPropagation(); // Prevent event propagation
                        row.toggleSelected(!row.getIsSelected());
                      }}
                    />
                  </StyledTableCell>
                )}
                {row.getVisibleCells().map((cell) => (
                  <StyledTableCell key={cell.id} enableRowSelection={enableRowSelection}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </StyledTableCell>
                ))}
              </StyledTableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={
                  enableRowSelection
                    ? table.getAllColumns().length + 1
                    : table.getAllColumns().length
                }
                align="center"
              >
                <Typography variant="body-small">
                  {loadingData ? "Loading..." : "No data available"}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MUITable>
    </StyledTableContainer>
  );
};

export default TableComponent;
