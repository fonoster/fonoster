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
import { type ColumnDef, type Table } from "@tanstack/react-table";

export type FeatureOption = "pagination" | "filters" | "selection";
export type SortOrder = "asc" | "desc";

export interface FilterField {
  label: string;
  value: string;
}

export interface CursorPagination {
  total: number;
  nextToken: string | null | undefined;
  prevToken: string | null | undefined;
}

export interface DataTable<T> {
  columns: ColumnDef<T, any>[];
  features?: FeatureOption[];
  getRowId: (row: T) => string;
}

export interface UseDataTable<T> extends DataTable<T> {
  data: T[];
}

export interface BaseDataTable<T> extends DataTable<T> {
  pagination: CursorPagination;
  searchBy: string;
  searchableFields: FilterField[];
  onSearch: (term: string) => void;
  onSearchByFieldChange: (field: string) => void;
  onSortChange?: (columnId: string, order: SortOrder) => void;
  onDeleteSelected?: (selected: T[]) => void;
  onEditSelected?: (row: T) => void;
}

export interface DataTableProps<T> extends BaseDataTable<T> {
  data: T[];
  pageSize: number;
  onNextPage: VoidFunction;
  onPrevPage: VoidFunction;
  variant?: "default" | "compact";
  isLoading?: boolean;
}

export interface DataTableContextProps<T> extends BaseDataTable<T> {
  table: Table<T>;
  features: FeatureOption[];
  variant?: "default" | "compact";
  isLoading?: boolean;
  selectedRows: T[];
  pageSize: number;
  onNextPage: VoidFunction;
  onPrevPage: VoidFunction;
}

export interface DataTableContextProviderProps<T>
  extends DataTableProps<T>,
    React.PropsWithChildren {
  features: FeatureOption[];
}
