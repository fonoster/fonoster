import { useContext } from "react";
import TableContext, { TableContextProps } from "./TableProvider";

export function useTableContext<TData>() {
  const context = useContext(TableContext);
  if (!context || !context.table) {
    throw new Error("useTableContext must be used within a TableProvider");
  }
  return context as TableContextProps<TData>;
}
