import { ReactNode } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { ColumnDef } from "@tanstack/react-table";
import ReactTable from "@/common/components/context-table/ReactTable";

interface PageWithTableProps {
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

function PageWithTable({ children }: PageWithTableProps) {
  return <Box>{children}</Box>;
}

function Header({ title, actions }: HeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5">{title}</Typography>
      {actions}
    </Box>
  );
}

function Description({ children }: DescriptionProps) {
  return (
    <Typography variant="body1" sx={{ mb: 3 }}>
      {children}
    </Typography>
  );
}

function Content<T extends object>({ columns, children, tableId = "table" }: ContentProps<T>) {
  return (
    <ReactTable<T> columns={columns}>
      <ReactTable.Header>
          <ReactTable.Header.Filter
            value={''}
            onChange={() => {}}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
          <ReactTable.Header.Search
            value={''}
            onChange={() => {}}
            placeholder="Search numbers..."
          />
          <ReactTable.Header.Pagination
            currentPage={1}
            totalPages={10}
            onPageChange={() => {}}
          />
        </ReactTable.Header>
        <Divider sx={{ mb: 0, mt: 1 }} />
        <ReactTable.Content id={tableId} />
      {children}
    </ReactTable>
  );
}

PageWithTable.Header = Header;
PageWithTable.Description = Description;
PageWithTable.Content = Content;

export default PageWithTable;
