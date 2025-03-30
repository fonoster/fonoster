import { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import ReactTable from "@stories/table/ReactTable";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { LinkBackTo } from "@stories/linkbackto/LinkBackTo";
import { Typography } from "@stories/typography/Typography";
import React from "react";
import { TableOptions } from "@stories/table/TableComponent";

interface PageContainerProps {
  children: ReactNode;
}

interface HeaderProps {
  title: string;
  actions?: ReactNode;
  backTo?: {
    label: string;
    onClick: () => void;
  };
}

interface DescriptionProps {
  children: ReactNode;
}

interface ContentProps<T extends object> {
  columns: ColumnDef<T>[];
  children?: ReactNode;
  tableId?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  showSelectAll?: boolean;
  onRowSelection?: (row: T) => void;
  options?: TableOptions;
}

interface ContentFormProps<T extends object> {
  children?: ReactNode;
  formId?: string;
  methods: UseFormReturn<T>;
}

function PageContainer({ children }: PageContainerProps) {
  return <Box sx={{ mb: 6 }}>{children}</Box>;
}

function Header({ title, actions, backTo }: HeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {backTo && (
        <Box sx={{ mb: 1.5 }}>
          <LinkBackTo label={backTo.label} onClick={backTo.onClick} />
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Typography variant="heading-medium">{title}</Typography>
        {actions}
      </Box>
    </Box>
  );
}

function Subheader({ children }: DescriptionProps) {
  return (
    <Typography variant="body-medium" sx={{ mb: 8 }}>
      {children}
    </Typography>
  );
}

function ContentTable<T extends object>({
  columns,
  children,
  tableId = "table",
  showFilters = true,
  showSearch = true,
  showPagination = true,
  showSelectAll = false,
  onRowSelection,
  options
}: ContentProps<T>) {
  return (
    <ReactTable<T> columns={columns} enableRowSelection={showSelectAll}>
      <ReactTable.Header>
        {showSelectAll && <ReactTable.Header.SelectAll />}
        {showFilters && <ReactTable.Header.Filter />}
        {showSearch && <ReactTable.Header.Search />}
        {showPagination && <ReactTable.Header.Pagination />}
      </ReactTable.Header>
      <Box sx={{ mb: 0, mt: 1 }} />
      <ReactTable.Content
        id={tableId}
        options={options}
        enableRowSelection={showSelectAll}
        onRowSelection={onRowSelection}
      />
      {children}
    </ReactTable>
  );
}

function ContentForm<T extends object>({
  children,
  formId,
  methods
}: ContentFormProps<T>) {
  return (
    <Box
      component="form"
      id={formId}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        borderColor: "divider",
        borderRadius: 1,
        "& .MuiFormControl-root": {
          width: "100%",
          maxWidth: "500px"
        },
        "& .MuiInputLabel-root": {
          mb: 1,
          color: "text.primary",
          fontWeight: 500
        },
        "& .MuiOutlinedInput-root": {
          bgcolor: "background.default"
        }
      }}
      noValidate
      autoComplete="off"
    >
      <Stack
        spacing={{ xs: 1, sm: 2, md: 3 }}
        useFlexGap
        sx={{
          alignItems: "flex-start"
        }}
      >
        <FormProvider {...methods}>{children}</FormProvider>
      </Stack>
    </Box>
  );
}

PageContainer.Header = Header;
PageContainer.Subheader = Subheader;
PageContainer.ContentTable = ContentTable;
PageContainer.ContentForm = ContentForm;

export default PageContainer;
