import { ColumnDef } from "@tanstack/react-table";
import { TableProvider } from "./TableProvider";
import { TableHeader } from "./TableHeader";
import TableComponent from "./TableComponent";
import { JSX } from "react";

type ReactTableProps<T extends object> = {
  columns: ColumnDef<T>[];
  children?: React.ReactNode;
};

interface ReactTableComponent {
  <T extends object>(props: ReactTableProps<T>): JSX.Element;
  Header: typeof TableHeader;
  Content: typeof TableComponent;
}

const ReactTable = <T extends object>({
  columns,
  children
}: ReactTableProps<T>) => {
  return <TableProvider<T> columns={columns}>{children}</TableProvider>;
};

// Compound Components
ReactTable.Header = TableHeader;
ReactTable.Content = TableComponent;

export default ReactTable as ReactTableComponent;
