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
import type { WorkspaceMemberDTO } from "./members.interfaces";
import { Stack } from "@mui/material";
import { Icon } from "~/core/components/design-system/icons/icons";
import { Tooltip } from "~/core/components/design-system/ui/tooltip/tooltip";
import { useCallback } from "react";

export interface ActionsCellProps {
  member: WorkspaceMemberDTO;
  onSendEmail: (member: WorkspaceMemberDTO) => void;
  onDelete: (member: WorkspaceMemberDTO) => void;
}

export const ActionsCell = ({
  member,
  onSendEmail,
  onDelete
}: ActionsCellProps) => {
  const isPending = member.status === "PENDING";

  const handleSendEmail = useCallback(() => {
    if (isPending) {
      onSendEmail(member);
    }
  }, [isPending, member, onSendEmail]);

  return (
    <Stack direction="row" gap="4px" alignItems="center" width="100%">
      <Tooltip title="Resend invitation" placement="bottom">
        <span>
          <Icon
            name="Email"
            sx={{
              fontSize: "16px",
              color: "base.04",
              opacity: isPending ? 1 : 0.5,
              cursor: isPending ? "pointer" : "not-allowed",
              pointerEvents: isPending ? "auto" : "none"
            }}
            onClick={handleSendEmail}
          />
        </span>
      </Tooltip>

      <Tooltip title="Delete member" placement="bottom">
        <span>
          <Icon
            name="Delete"
            fontSize="small"
            onClick={() => onDelete(member)}
            sx={{
              fontSize: "16px",
              color: "base.04",
              cursor: "pointer"
            }}
          />
        </span>
      </Tooltip>
    </Stack>
  );
};

export const getColumns = (
  onDelete: (member: WorkspaceMemberDTO) => void,
  onSendEmail: (member: WorkspaceMemberDTO) => void
): ColumnDef<WorkspaceMemberDTO>[] => [
  {
    id: "name",
    accessorKey: "name",
    header: "NAME",
    enableSorting: false,
    cell: ({ row: { original: member } }) => member.name
  },
  {
    id: "email",
    accessorKey: "email",
    header: "EMAIL",
    enableSorting: false,
    cell: ({ row: { original: member } }) => member.email
  },
  {
    id: "role",
    header: "ROLE",
    enableSorting: false,
    cell: ({ row: { original: member } }) => member.role
  },
  {
    id: "dateAdded",
    header: "DATE ADDED",
    enableSorting: false,
    cell: ({ row: { original: member } }) =>
      member.createdAt.toLocaleDateString("es-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
  },
  {
    id: "status",
    header: "STATUS",
    enableSorting: false,
    cell: ({ row: { original: member } }) => member.status
  },
  {
    id: "actions",
    header: "ACTIONS",
    enableSorting: false,
    cell: ({ row: { original: member } }) => (
      <ActionsCell
        member={member}
        onSendEmail={onSendEmail}
        onDelete={onDelete}
      />
    )
  }
];
