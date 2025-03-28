"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Grid, useTheme } from "@mui/material";
import { useTableContext } from "./useTableContext";
import { Pagination } from "@stories/pagination/Pagination";
import { InputText } from "@stories/inputtext/InputText";
import { Select } from "@stories/select/Select";
import IndeterminateCheckbox from "./checkbox/IndeterminateCheckbox";
import { Icon } from "@stories/icon/Icon";

interface FilterProps {
  defaultFilter?: string;
}

interface SearchProps {
  placeholder?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
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
  SelectAll: React.FC;
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
  defaultFilter = "Filter By"
}: {
  defaultFilter?: string;
}) => {
  const { headers, setColumnFilters, columnFilters } = useTableContext();

  // Use local state to control the select value directly
  const [selectedOption, setSelectedOption] = useState<string>(defaultFilter);

  // Simple options array - use useMemo to prevent recreation on every render
  const options = useMemo(
    () => [
      { label: "Filter By", value: "Filter By" },
      ...headers
        .filter((column) => column.id)
        .map((column) => ({
          label:
            typeof column.header === "string"
              ? column.header
              : String(column.id),
          value: column.id as string
        }))
    ],
    [headers]
  );

  // Direct handler function
  const handleChange = useCallback(
    (event: { target: { value: string | number | (string | number)[] } }) => {
      const value = Array.isArray(event.target.value)
        ? event.target.value[0]
        : event.target.value;

      // Update local state immediately
      setSelectedOption(value as string);

      // Then update the table filters
      if (value === "Filter By") {
        // Clear filters completely
        if (setColumnFilters) {
          setColumnFilters([]);
        }
      } else {
        // Set the new filter - ensure we're creating a new array to trigger state updates
        if (setColumnFilters) {
          const newFilters = [
            {
              id: value as string,
              value: ""
            }
          ];
          setColumnFilters(newFilters);
        }
      }
    },
    [setColumnFilters]
  );

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      options={options}
      label=""
      size="medium"
      fullWidth
    />
  );
};

TableHeaderComponent.Search = ({
  placeholder = "Search Term",
  size = "medium",
  fullWidth = true
}: {
  placeholder?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}) => {
  const { setGlobalFilter, columnFilters, setColumnFilters } =
    useTableContext();
  const [searchValue, setSearchValue] = useState("");

  // Sync with global filter when has internally changes
  useEffect(() => {
    // If there is a column filter selected, update the search value
    if (columnFilters && columnFilters.length > 0) {
      const currentFilter = columnFilters[0];
      if (currentFilter?.value && typeof currentFilter.value === "string") {
        setSearchValue(currentFilter.value);
      }
    }
  }, [columnFilters]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      // If there is a column filter selected, update its value
      if (columnFilters && columnFilters.length > 0) {
        const currentFilter = columnFilters[0];
        if (setColumnFilters) {
          setColumnFilters([
            {
              id: currentFilter.id,
              value: value
            }
          ]);
        }
      } else {
        // If there is not a column filter, use the global filter
        if (setGlobalFilter) {
          setGlobalFilter(value);
        }
      }
    },
    [setGlobalFilter, columnFilters, setColumnFilters]
  );

  return (
    <InputText
      placeholder={placeholder}
      value={searchValue}
      onChange={handleChange}
      size={size}
      fullWidth={fullWidth}
      trailingIcon={<Icon fontSize="small" name="Search" />}
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
        disabled={fonosterResponse?.recordTotal === 0}
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

TableHeaderComponent.SelectAll = () => {
  const { getIsAllRowsSelected, getIsSomeRowsSelected, table } =
    useTableContext();

  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: "4px",
        height: "42px",
        minWidth: "42px",
        justifyContent: "center",
        backgroundColor: `inherit`,
        border: `1px solid ${theme.palette.grey["200"]}`,
        padding: "8px 12px"
      }}
      onClick={(e) => {
        e.stopPropagation();
        table.toggleAllRowsSelected(!getIsAllRowsSelected());
      }}
    >
      <IndeterminateCheckbox
        checked={getIsAllRowsSelected()}
        indeterminate={getIsSomeRowsSelected()}
        onChange={(e) => {
          e.stopPropagation(); // Prevent event propagation
          table.toggleAllRowsSelected(!getIsAllRowsSelected());
        }}
      />
    </Box>
  );
};

export default TableHeaderComponent;
