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
import { flexRender, type Row } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow } from "@mui/material";
import { useDataTable } from "../data-table.context";
import { Checkbox } from "../../checkbox/checkbox";

export interface DataTableBodyRowProps {
  row: Row<any>;
  showSelection: boolean;
}

const DataRow = ({ row, showSelection }: DataTableBodyRowProps) => (
  <TableRow key={row.id} selected={row.getIsSelected()}>
    {showSelection && (
      <TableCell data-selection-cell="true">
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      </TableCell>
    )}
    {row.getVisibleCells().map((cell: any) => (
      <TableCell key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    ))}
  </TableRow>
);

const EmptyStateRow = ({ colSpan }: { colSpan: number }) => (
  <TableRow sx={{ height: 72 }}>
    <TableCell colSpan={colSpan} sx={{ textAlign: "center !important" }}>
      Oops! You don't have any data yet.
    </TableCell>
  </TableRow>
);

export function DataTableBody() {
  const { table, features } = useDataTable();
  const rows = table.getRowModel().rows;
  const showSelection = features.includes("selection");

  const colspan = showSelection
    ? table.getAllColumns().length + 1
    : table.getAllColumns().length;

  return (
    <TableBody>
      {rows.length > 0 ? (
        rows.map((row) => (
          <DataRow key={row.id} row={row} showSelection={showSelection} />
        ))
      ) : (
        <EmptyStateRow colSpan={colspan} />
      )}
    </TableBody>
  );
}
