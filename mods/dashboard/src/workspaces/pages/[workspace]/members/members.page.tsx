/**
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
import { Role, WorkspaceMemberStatus } from "@fonoster/types";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import type { Route } from "./+types/members.page";
import { Page } from "~/core/components/general/page/page";
import { DataTable } from "~/core/components/design-system/ui/data-table/data-table";
import { getColumns } from "./members.columns";
import { useCallback, useMemo, useRef, useState } from "react";
import type { WorkspaceMemberDTO } from "./members.interfaces";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { MembersPageHeader } from "./members.page-header";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Workspace Members | Fonoster" },
    {
      name: "description",
      content: "Manage your workspace members and their permissions."
    }
  ];
}

export default function Members() {
  const [searchBy, onSearchByFieldChange] = useState("name");
  const workspaceId = useWorkspaceId();
  const members: WorkspaceMemberDTO[] = [
    {
      ref: "ref_4g2tj128",
      userRef: "user_4g2tj128",
      name: "Efrain Peralta",
      email: "e@fonoster.com",
      role: Role.USER,
      status: WorkspaceMemberStatus.ACTIVE,
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z")
    },
    {
      ref: "ref_4g2tj12s8",
      userRef: "user_4g2dtj128",
      name: "Pedro Sanders",
      email: "epedro@fonoster.com",
      role: Role.WORKSPACE_OWNER,
      status: WorkspaceMemberStatus.ACTIVE,
      createdAt: new Date("2024-04-08T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z")
    }
  ];

  const onDelete = useCallback(
    (member: WorkspaceMemberDTO) => {
      console.log("Form submitted", member);
      toast("Delete member not implemented yet");
    },
    [workspaceId]
  );

  const onSendEmail = useCallback(
    (member: WorkspaceMemberDTO) => {
      console.log("Form submitted", member);
      toast("Send email not implemented yet");
    },
    [workspaceId]
  );

  const columns = useMemo(
    () => getColumns(onDelete, onSendEmail),
    [onDelete, onSendEmail]
  );

  const { current: pageSize } = useRef(10);

  return (
    <Page variant="form">
      <MembersPageHeader />
      <DataTable
        variant="compact"
        data={members}
        columns={columns}
        searchBy={searchBy}
        searchableFields={[]}
        getRowId={(row) => row.ref}
        pageSize={pageSize}
        pagination={{
          total: members.length,
          nextToken: null,
          prevToken: null
        }}
        onNextPage={() => null}
        onPrevPage={() => null}
        onSearch={(term) => console.log(term)}
        onSearchByFieldChange={onSearchByFieldChange}
        onDeleteSelected={(rows) =>
          toast(`Delete: ${rows.map((r) => r.name).join(", ")}`)
        }
        onEditSelected={(row) => toast(`Edit: ${row.name}`)}
        features={["pagination"]}
      />
    </Page>
  );
}
