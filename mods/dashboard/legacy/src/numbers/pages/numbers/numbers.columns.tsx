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
import type { INumber } from "@fonoster/types";

/**
 * Column definitions for rendering a table of Fonoster Numbers using TanStack Table.
 *
 * Each column maps a property of the `INumber` object to a table header and cell.
 * This configuration enables sorting, filtering, and custom rendering in table UIs.
 */
export const columns: ColumnDef<INumber>[] = [
  {
    /**
     * Unique identifier column for the number.
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
     * Human-readable name of the number.
     *
     * Often used by users to identify a number easily in the UI.
     */
    id: "name",
    header: "Name",
    accessorKey: "name"
  },
  {
    /**
     * Telephone URL associated with the number.
     *
     * This represents the SIP or telephone endpoint for the number.
     */
    id: "telUrl",
    header: "Tel URL",
    accessorKey: "telUrl"
  },
  {
    /**
     * Formatted address composed of city, country, and ISO country code.
     *
     * Combines the city, country, and ISO code into a single cell for easier reading.
     */
    id: "address",
    header: "Address",
    accessorFn: (row) => {
      const { city, country, countryIsoCode } = row;
      return `${city}, ${country} (${countryIsoCode})`;
    }
  },
  {
    /**
     * Agent AOR (Address of Record) associated with the number.
     *
     * Represents the SIP endpoint or user that handles calls to this number.
     */
    id: "agentAor",
    header: "Agent AOR",
    accessorKey: "agentAor"
  },
  {
    /**
     * Reference to the application linked to this number.
     *
     * This helps track which application is using this number.
     */
    id: "appRef",
    header: "Application Ref",
    accessorKey: "appRef"
  }
];
