import { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import ReactTable from "@/common/contexts/table/ReactTable";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { LinkBackTo } from "@stories/linkbackto/LinkBackTo";
import { Typography } from "@stories/typography/Typography";

interface PageContainerProps {
  children: ReactNode;
}

interface HeaderProps {
  title: string;
  actions?: ReactNode;
}

interface DescriptionProps {
  children: ReactNode;
}

interface ContentProps<T extends object> {
  columns: ColumnDef<T>[];
  children?: ReactNode;
  tableId?: string;
}

interface ContentFormProps<T extends object> {
  children?: ReactNode;
  formId?: string;
  methods: UseFormReturn<T>;
}

function PageContainer({ children }: PageContainerProps) {
  return <Box sx={{ mb: 8 }}>{children}</Box>;
}

interface HeaderProps {
  title: string;
  actions?: ReactNode;
  backTo?: {
    label: string;
    onClick: () => void;
  };
}

function Header({ title, actions, backTo }: HeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
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
        <Typography
          variant="heading-medium"
        >
          {title}
        </Typography>
        {actions}
      </Box>
    </Box>
  );
}

function Subheader({ children }: DescriptionProps) {
  return (
    <Typography variant="body-medium" sx={{ mb: 3 }}>
      {children}
    </Typography>
  );
}

function ContentTable<T extends object>({
  columns,
  children,
  tableId = "table"
}: ContentProps<T>) {
  return (
    <ReactTable<T> columns={columns}>
      <ReactTable.Header>
        <ReactTable.Header.Filter />
        <ReactTable.Header.Search
          value={""}
          onChange={() => { }}
          placeholder="Search..."
        />
        <ReactTable.Header.Pagination
          currentPage={1}
          totalPages={10}
          onPageChange={() => { }}
        />
      </ReactTable.Header>
      <Box sx={{ mb: 0, mt: 1 }} />
      <ReactTable.Content id={tableId} />
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
