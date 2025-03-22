import { ColumnDef } from "@tanstack/react-table";
import { TableProvider } from "./TableProvider";
import TableHeader from "./TableHeader";
import TableComponent from "./TableComponent";
import { JSX } from "react";

type ReactTableProps<T extends object> = {
  columns: ColumnDef<T>[];
  children?: React.ReactNode;
  enableRowSelection?: boolean;
};

interface ReactTableComponent {
  <T extends object>(props: ReactTableProps<T>): JSX.Element;
  Header: typeof TableHeader & {
    Filter: typeof TableHeader.Filter;
    Search: typeof TableHeader.Search;
    Pagination: typeof TableHeader.Pagination;
  };
  Content: typeof TableComponent;
}

const ReactTable = <T extends object>({
  columns,
  children,
  enableRowSelection = false
}: ReactTableProps<T>) => {
  return (
    <TableProvider<T> columns={columns} enableRowSelection={enableRowSelection}>
      {children}
    </TableProvider>
  );
};

// Compound Components
ReactTable.Header = Object.assign(TableHeader, {
  Filter: TableHeader.Filter,
  Search: TableHeader.Search,
  Pagination: TableHeader.Pagination
});
ReactTable.Content = TableComponent;

export default ReactTable as ReactTableComponent;
