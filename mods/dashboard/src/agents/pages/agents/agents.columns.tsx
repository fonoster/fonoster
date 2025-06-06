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
import type { Agent } from "@fonoster/types";

/**
 * Column definitions for rendering a table of Fonoster Agents using TanStack Table.
 *
 * Each column maps a property of the `Agent` object to a table header and cell.
 * This configuration enables sorting, filtering, and custom rendering in table UIs.
 */
export const columns: ColumnDef<Agent>[] = [
  {
    /**
     * Unique identifier column for the agent.
     *
     * - Typically a UUID or an internal reference string.
     * - Helps uniquely identify each agent record.
     * - Useful for backend linking, debugging, or API interactions.
     */
    id: "ref",
    header: "Ref",
    accessorKey: "ref"
  },
  {
    /**
     * Human-readable name of the agent.
     *
     * - Makes it easier for users to identify agents.
     * - Can be a friendly name or descriptive label.
     */
    id: "name",
    header: "Name",
    accessorKey: "name"
  },
  {
    /**
     * Username associated with the agent.
     *
     * - Indicates which user account is using this agent.
     * - Often corresponds to the SIP username or system login.
     * - Useful for administrators to manage credentials.
     */
    id: "username",
    header: "Username",
    accessorKey: "username"
  },
  {
    /**
     * Domain to which the agent belongs.
     *
     * - Renders the name of the associated domain.
     * - Useful for distinguishing agents across different SIP domains or tenants.
     * - Enhances context for administrators managing multiple domains.
     */
    id: "domain.name",
    header: "Domain",
    accessorKey: "domain.name"
  },
  {
    /**
     * Status of the agent.
     *
     * - Displays whether the agent is enabled or disabled.
     * - Uses a custom cell renderer to show a human-readable status.
     * - Helps admins quickly see which agents are active or inactive.
     */
    id: "status",
    header: "Status",
    accessorKey: "enabled",
    cell: ({ row }) => (row.original.enabled ? "Enabled" : "Disabled")
  },
  {
    /**
     * Privacy setting of the agent.
     *
     * - Indicates if privacy is enabled for this agent.
     * - Can be used to control features like SIP privacy or caller ID suppression.
     */
    id: "privacy",
    header: "Privacy",
    accessorKey: "privacy"
  }
];
