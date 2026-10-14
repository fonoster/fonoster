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
import { TableCell, TableHead, TableRow } from "@mui/material";
import { useDataTable } from "../data-table.context";
import { DataTableColumnHeader } from "./data-table-column-header";

export function DataTableHead() {
  const { table, features } = useDataTable();

  return (
    <TableHead>
      <TableRow>
        {features.includes("selection") && (
          <TableCell data-selection-cell="true" />
        )}
        {table
          .getHeaderGroups()
          .map((group) =>
            group.headers.map((header) => (
              <DataTableColumnHeader key={header.id} header={header} />
            ))
          )}
      </TableRow>
    </TableHead>
  );
}
