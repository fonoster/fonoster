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
import type { ColumnDef } from "@tanstack/react-table";
import type { ApiKey } from "~/api-keys/services/api-keys.interfaces";

/**
 * Column definitions for rendering a table of Fonoster API Keys using TanStack Table.
 *
 * Each column maps a property of the `API Keys` object to a table header and cell.
 * This configuration enables sorting, filtering, and custom rendering in table UIs.
 */
export const columns = [
  {
    /**
     * Unique identifier column for the API key.
     *
     * Typically a UUID or internal reference string, used for identifying
     * the row uniquely within the table and backend systems.
     */
    id: "ref",
    header: "Ref",
    accessorKey: "ref"
  },
  {
    /**
     * Human-readable name of the API key.
     *
     * Often used by users to identify a API key easily in the UI.
     */
    id: "accessKeyId",
    header: "Access Key ID",
    accessorKey: "accessKeyId"
  }
] satisfies ColumnDef<ApiKey>[];
