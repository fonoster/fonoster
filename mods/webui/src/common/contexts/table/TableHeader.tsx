"use client";

import React from "react";
import { Box, Grid } from "@mui/material";
import { useTableContext } from "./useTableContext";
import { Pagination } from "@stories/pagination/Pagination";
import { InputText } from "@stories/inputtext/InputText";
import { Icon } from "@stories/icon/Icon";
import { Select } from "@stories/select/Select";

interface FilterProps {
  defaultFilter?: string;
}

interface SearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

interface TableHeaderProps {
  children?: React.ReactNode;
}

interface TableHeaderComponent extends React.FC<TableHeaderProps> {
  Filter: React.FC<FilterProps>;
  Search: React.FC<SearchProps>;
  Pagination: React.FC<PaginationProps>;
}

const TableHeaderComponent = <T extends object>({
  children
}: TableHeaderProps) => {
  // Separar los children en controles y paginación
  const childrenArray = React.Children.toArray(children);
  const paginationComponent = childrenArray.find(
    (child) =>
      React.isValidElement(child) &&
      child.type === TableHeaderComponent.Pagination
  );
  const otherComponents = childrenArray.filter(
    (child) =>
      React.isValidElement(child) &&
      child.type !== TableHeaderComponent.Pagination
  );

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid
        item
        xs={12}
        md={6}
        sx={{ display: "flex", gap: 2, alignItems: "center" }}
      >
        {otherComponents}
      </Grid>
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          justifyContent: { xs: "flex-start", md: "flex-end" }
        }}
      >
        {paginationComponent}
      </Grid>
    </Grid>
  );
};

// Compound Components
TableHeaderComponent.Filter = ({
  defaultFilter = "All"
}: {
  defaultFilter?: string;
}) => {
  const { headers, setColumnFilters, columnFilters } = useTableContext();

  const options = headers.map((column, index) => ({
    label:
      index === 0
        ? "All"
        : column.header && typeof column.header === "string"
          ? column.header
          : `Column ${index}`,
    value: index === 0 ? "All" : column.id || `column-${index}`
  }));

  // Get the first column filter if it exists
  const currentFilter =
    (columnFilters?.[0]?.value as string) || defaultFilter || "";

  return (
    <Select
      value={currentFilter}
      onChange={(e) => {
        const value = e.target.value;
        if (value === "All") {
          setColumnFilters?.([]);
        } else {
          setColumnFilters?.([
            {
              id: value as string,
              value: value as string
            }
          ]);
        }
      }}
      options={options}
      label=""
      size="small"
      fullWidth
    />
  );
};

TableHeaderComponent.Search = ({
  value = "",
  onChange,
  placeholder = "Search..."
}: SearchProps) => {
  const { globalFilter, setGlobalFilter } = useTableContext();

  return (
    <InputText
      leadingIcon={<Icon fontSize="small" name="Search" />}
      onChange={(e) => setGlobalFilter?.(e.target.value)}
      value={globalFilter || value}
      placeholder={placeholder}
      shrink={false}
      size="small"
    />
  );
};

TableHeaderComponent.Pagination = () => {
  const {
    fonosterResponse,
    setNextPageCursor,
    setPrevPageCursor,
    nextPage,
    previousPage,
    pageSize
  } = useTableContext();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Pagination
        count={fonosterResponse?.recordTotal || 0}
        rowsPerPage={pageSize}
        onClick={(event, newPage, lastPage) => {
          if (newPage > lastPage) {
            setNextPageCursor?.(fonosterResponse?.nextPageToken);
            nextPage?.();
          } else {
            setPrevPageCursor?.(fonosterResponse?.prevPageToken);
            previousPage?.();
          }
        }}
      />
    </Box>
  );
};

export default TableHeaderComponent;
