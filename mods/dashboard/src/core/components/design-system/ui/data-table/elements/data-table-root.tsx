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
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableHead } from "./data-table-head";
import { DataTableBody } from "./data-table-body";
import {
  DataTableContainerElement,
  DataTableRootElement,
  TableRoot
} from "./data-table.styles";
import { useDataTable } from "../data-table.context";

export function DataTableRoot() {
  const { table, features } = useDataTable();
  return (
    <DataTableRootElement>
      <DataTableToolbar />

      <DataTableContainerElement>
        <TableRoot>
          <colgroup>
            {features.includes("selection") && (
              <col style={{ width: "48px" }} />
            )}
            {table.getAllColumns().map((column) => (
              <col key={column.id} />
            ))}
          </colgroup>
          <DataTableHead />
          <DataTableBody />
        </TableRoot>
      </DataTableContainerElement>
    </DataTableRootElement>
  );
}
