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
import type { Domain } from "@fonoster/types";
import { Tooltip } from "~/core/components/design-system/ui/tooltip/tooltip";
import { Box } from "@mui/material";

/**
 * Column definitions for rendering a table of Fonoster Domains using TanStack Table.
 *
 * Each column maps a property of the `Domain` object to a table header and cell.
 * This configuration enables:
 * - Sorting
 * - Filtering
 * - Custom rendering for specific columns (e.g., egressPolicies).
 */
export const columns: ColumnDef<Domain>[] = [
  {
    /**
     * Unique identifier for the domain.
     *
     * Typically a UUID or internal reference string.
     * Useful for linking or identifying the record in detail pages.
     */
    id: "ref",
    header: "Ref",
    accessorKey: "ref"
  },
  {
    /**
     * Human-readable name of the domain.
     *
     * Often used by users to identify the domain in the UI.
     */
    id: "name",
    header: "Name",
    accessorKey: "name"
  },
  {
    /**
     * URI that identifies the domain.
     *
     * Usually in the format 'sip:domain.example.com'.
     */
    id: "domainUri",
    header: "Domain URI",
    accessorKey: "domainUri"
  },
  {
    /**
     * Reference to the associated Access Control List.
     *
     * This allows the user to quickly see the ACL linked to this domain.
     */
    id: "accessControlListRef",
    header: "Access Control List Ref",
    accessorKey: "accessControlListRef"
  },
  {
    /**
     * Displays the domain's egress policies in a concise, user-friendly way.
     *
     * - Shows a comma-separated list of policies.
     * - Each policy includes the rule and the linked number reference.
     * - Uses a tooltip to show the full list on hover.
     * - If no policies exist, displays "None".
     */
    id: "egressPolicies",
    header: "Egress Policies",
    accessorKey: "egressPolicies",
    cell: ({ row }) => {
      // Extract egress policies from the row data.
      const policies =
        (row.getValue("egressPolicies") as Domain["egressPolicies"]) || [];

      // Format policies into a readable string: "rule (numberRef)"
      const label = policies
        .map(({ rule, numberRef }) => `${rule} (${numberRef})`)
        .join(", ");

      // Handle the case where there are no policies assigned.
      if (policies.length === 0) {
        return "None";
      }

      // Display the label in a tooltip for better readability.
      return (
        <Tooltip title={label}>
          <Box
            component="span"
            sx={{
              display: "inline-block",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {label}
          </Box>
        </Tooltip>
      );
    }
  }
];
