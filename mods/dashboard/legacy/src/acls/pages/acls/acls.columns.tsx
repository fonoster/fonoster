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
import type { Acl } from "@fonoster/types";
import { Tooltip } from "~/core/components/design-system/ui/tooltip/tooltip";
import { Box } from "@mui/material";

/**
 * Column definitions for rendering a table of Fonoster ACLs using TanStack Table.
 *
 * Each column maps a property of the `Acl` object to a table header and cell.
 * This configuration enables sorting, filtering, and custom rendering in table UIs.
 */
export const columns: ColumnDef<Acl>[] = [
  {
    /**
     * Unique identifier column for the ACL.
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
     * Human-readable name of the ACL.
     *
     * Often used by users to identify an ACL easily in the UI.
     */
    id: "name",
    header: "Name",
    accessorKey: "name"
  },
  {
    /**
     * Allow List column.
     *
     * Renders a comma-separated list of allowed permissions or
     * "No permissions" if the list is empty.
     *
     * This allows the user to quickly see what resources are accessible
     * under this ACL.
     */
    id: "allow",
    header: "Allow List",
    accessorKey: "allow",
    cell: ({ row }) => {
      const allowList = row.getValue("allow") as string[];
      const label = allowList.length > 0 ? allowList.join(", ") : "No rules";

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
