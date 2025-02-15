import TableComponent from './TableComponent';
import { TableProvider } from './TableProvider';
import { ColumnDef } from '@tanstack/react-table';
import { TableHeader } from './TableHeader';

type ReactTableProps<T extends object> = {
  columns: ColumnDef<T>[];
  children: React.ReactNode;
}

const ReactTable = <T extends object,>({ columns, children }: ReactTableProps<T>) => {
  return (
    <TableProvider<T> columns={columns}>
      <TableHeader<T> />
      <TableComponent<T> id="user-table" />
      {children}
    </TableProvider>
  );
};

export default ReactTable;
