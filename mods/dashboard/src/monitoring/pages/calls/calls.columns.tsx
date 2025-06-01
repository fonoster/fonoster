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
import type { CallDetailRecord } from "@fonoster/types";

/**
 * Column definitions for rendering a table of Fonoster Call Detail Records
 * using TanStack Table.
 *
 * Each column maps a property of the `CallDetailRecord` object to a table header
 * and cell. This configuration enables sorting, filtering, and custom rendering in table UIs.
 */
export const columns: ColumnDef<CallDetailRecord>[] = [
  {
    /**
     * Unique identifier column for the call record.
     *
     * Typically a UUID or internal reference string, used to identify
     * the row uniquely within the table and backend systems.
     */
    id: "ref",
    header: "Ref",
    accessorKey: "ref"
  },
  {
    /**
     * Status of the call.
     *
     * Examples: "Completed", "Failed", "Ringing".
     */
    id: "status",
    header: "Status",
    accessorKey: "status"
  },
  {
    /**
     * Direction of the call.
     *
     * Examples: "Inbound" or "Outbound".
     */
    id: "direction",
    header: "Direction",
    accessorKey: "direction"
  },
  {
    /**
     * Originating party of the call.
     *
     * Typically a phone number or SIP address.
     */
    id: "from",
    header: "From",
    accessorKey: "from"
  },
  {
    /**
     * Destination party of the call.
     *
     * Typically a phone number or SIP address.
     */
    id: "to",
    header: "To",
    accessorKey: "to"
  },
  {
    /**
     * Type of the call.
     *
     * Examples: "Voice", "Video".
     */
    id: "type",
    header: "Call Type",
    accessorKey: "type"
  },
  {
    /**
     * Duration of the call in seconds.
     *
     * Useful for analyzing call length and billing.
     */
    id: "duration",
    header: "Duration",
    accessorKey: "duration"
  }
];
