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
import { lastUuidSegment } from "../../../../../../core/helpers/last-uuid-segment";

/**
 * Props definition for a single row in the DataTableBody.
 */
export interface DataTableBodyRowProps {
  row: Row<any>;
  showSelection: boolean;
}

/**
 * Renders a single data row.
 * Optionally includes a selection checkbox if the "selection" feature is enabled.
 */
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
        {cell.column.id === "ref"
          ? lastUuidSegment(cell.getValue() as string)
          : flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    ))}
  </TableRow>
);

/**
 * Displays a placeholder row when the table is empty or loading.
 * @param colSpan - Number of columns to span across.
 * @param message - Text message to show in the empty row.
 */
const EmptyStateRow = ({
  colSpan,
  message
}: {
  colSpan: number;
  message: string;
}) => (
  <TableRow sx={{ height: 72 }}>
    <TableCell colSpan={colSpan} sx={{ textAlign: "center !important" }}>
      {message}
    </TableCell>
  </TableRow>
);

/**
 * Main component responsible for rendering the body of the data table.
 * Displays rows of data, a loading message, or an empty state depending on the table's state.
 */
export function DataTableBody() {
  const { table, features, isLoading } = useDataTable();

  /** All table rows based on current state and filters. */
  const rows = table.getRowModel().rows;

  /** Determines if selection checkboxes should be shown. */
  const showSelection = features.includes("selection");

  /** Calculates the number of columns to span for empty/loading rows. */
  const colSpan = table.getAllColumns().length + (showSelection ? 1 : 0);

  return (
    <TableBody>
      {rows.length > 0 ? (
        rows.map((row) => (
          <DataRow key={row.id} row={row} showSelection={showSelection} />
        ))
      ) : isLoading ? (
        <EmptyStateRow
          colSpan={colSpan}
          message="Hey! We're loading your data..."
        />
      ) : (
        <EmptyStateRow
          colSpan={colSpan}
          message="Oops! You don't have any data yet."
        />
      )}
    </TableBody>
  );
}
