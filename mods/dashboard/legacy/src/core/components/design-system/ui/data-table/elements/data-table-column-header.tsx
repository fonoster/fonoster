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
import { flexRender, type Header } from "@tanstack/react-table";
import { Box } from "@mui/material";
import { SortMenu } from "./data-table-sort-menu";
import { useDataTable } from "../data-table.context";
import { useCallback } from "react";
import type { SortOrder } from "../data-table.interfaces";
import { TableCellRoot } from "./data-table.styles";

export interface DataTableColumnHeaderProps<TData, TValue> {
  header: Header<TData, TValue>;
}

export function DataTableColumnHeader<TData, TValue>({
  header
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { column } = header;
  const { onSortChange } = useDataTable();

  const onSort = useCallback(
    (order: SortOrder) => {
      if (order === "asc") {
        column.toggleSorting(false);
      } else if (order === "desc") {
        column.toggleSorting(true);
      }

      if (onSortChange) {
        onSortChange(column.id, order);
      }
    },
    [column, onSortChange]
  );

  return (
    <TableCellRoot>
      <Box display="flex" alignItems="center" gap="4px">
        {flexRender(column.columnDef.header, header.getContext())}

        {column.getCanSort() && (
          <SortMenu column={column} onSortChange={onSort} />
        )}
      </Box>
    </TableCellRoot>
  );
}
