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
import type { DataTableProps } from "./data-table.interfaces";
import { DataTableProvider } from "./data-table.context";
import { DataTableRoot } from "./elements/data-table-root";
import { DATA_TABLE_FEATURES } from "./data-table.const";

export function DataTable<T>(props: DataTableProps<T>) {
  return (
    <DataTableProvider {...{ features: DATA_TABLE_FEATURES, ...props }}>
      <DataTableRoot />
    </DataTableProvider>
  );
}
