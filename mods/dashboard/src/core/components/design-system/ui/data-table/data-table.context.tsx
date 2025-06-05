/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createContext, useCallback, useContext } from "react";
import type {
  DataTableContextProps,
  DataTableContextProviderProps
} from "./data-table.interfaces";
import { useTable } from "./use-table";

export const DataTableContext =
  createContext<DataTableContextProps<any> | null>(null);

export const DataTableProvider = <T,>({
  data,
  columns,
  features,
  getRowId,
  onDeleteSelected,
  onEditSelected,
  children,
  ...rest
}: DataTableContextProviderProps<T>) => {
  const { table, selectedRows } = useTable({
    data,
    columns,
    features,
    getRowId
  });

  const onDeleteChanged = useCallback(() => {
    if (onDeleteSelected) {
      onDeleteSelected(selectedRows);
    }
  }, [onDeleteSelected, selectedRows]);

  const onEditChanged = useCallback(() => {
    if (onEditSelected && selectedRows.length === 1) {
      onEditSelected(selectedRows[0]);
    }
  }, [onEditSelected, selectedRows]);

  return (
    <DataTableContext.Provider
      value={{
        ...rest,
        onDeleteSelected: onDeleteSelected ? onDeleteChanged : undefined,
        onEditSelected: onEditSelected ? onEditChanged : undefined,
        table,
        columns,
        features,
        getRowId,
        selectedRows
      }}
    >
      {children}
    </DataTableContext.Provider>
  );
};

export const useDataTable = () => {
  const context = useContext(DataTableContext);

  if (!context) {
    throw new Error(
      "useDataTable() must be used within a <DataTableProvider />"
    );
  }

  return context;
};
