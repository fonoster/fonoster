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
import { useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState
} from "@tanstack/react-table";
import type { UseDataTable } from "./data-table.interfaces";
import { DATA_TABLE_FEATURES } from "./data-table.const";

export function useTable<T>({
  data,
  columns,
  features = DATA_TABLE_FEATURES,
  getRowId
}: UseDataTable<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    state: {
      rowSelection,
      sorting
    },
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: features.includes("selection"),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  return {
    selectedRows,
    table,
    rowSelection,
    sorting,
    setRowSelection,
    setSorting
  };
}
