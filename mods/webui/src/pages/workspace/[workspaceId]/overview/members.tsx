import PageContainer from "@/common/components/layout/pages";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useState } from "react";
import { InviteMemberModal } from "@/pages/workspace/_components/InviteMemberModal";
import { Button } from "@stories/button/Button";
import { Icon } from "@stories/icon/Icon";
import { QueryData } from "@/common/contexts/table/QueryData";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";
import { ListWorkspaceMembersResponse } from "@fonster/types";
import { formatToShortDate } from "@/utils/dayjs";
import { Stack } from "@mui/material";

const columns: ColumnDef<ListWorkspaceMembersResponse>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "NAME",
    cell: (props: { row: { original: ListWorkspaceMembersResponse } }) =>
      props.row.original.name
  },
  {
    id: "email",
    accessorKey: "email",
    header: "EMAIL",
    cell: (props: { row: { original: ListWorkspaceMembersResponse } }) =>
      props.row.original.email
  },
  {
    id: "role",
    header: "ROLE",
    cell: (props: { row: { original: ListWorkspaceMembersResponse } }) =>
      props.row.original.role
  },
  {
    id: "dateAdded",
    header: "DATE ADDED",
    cell: (props: { row: { original: ListWorkspaceMembersResponse } }) =>
      formatToShortDate(props.row.original.createdAt)
  },
  {
    id: "status",
    header: "STATUS",
    cell: (props: { row: { original: ListWorkspaceMembersResponse } }) =>
      props.row.original.status
  },
  {
    id: "actions",
    header: "Actions",
    cell: (props: { row: { original: ListWorkspaceMembersResponse } }) => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Icon name="Email" fontSize="small" />
        <Icon name="Delete" fontSize="small" />
      </Stack>
    )
  }
];

export default function MembersPage() {
  const router = useRouter();
  const { workspaceId } = router.query;
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { listWorkspaceMembers } = useWorkspaces();

  const handleInviteMember = (data: any) => {
    console.log("Invite member data:", data);
    setIsInviteModalOpen(false);
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Workspace Members"
        actions={
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            endIcon={<Icon fontSize="small" name="Add" />}
            variant="outlined"
          >
            Invite new member
          </Button>
        }
        backTo={{
          label: "Back to Overview",
          onClick: () => router.push(`/workspace/${workspaceId}/overview`)
        }}
      />

      <PageContainer.ContentTable<ListWorkspaceMembersResponse>
        columns={columns}
        tableId="members-table"
        showFilters={true}
        showSearch={true}
        showPagination={true}
      >
        <QueryData<ListWorkspaceMembersResponse>
          fetchFunction={listWorkspaceMembers}
          pageSize={10}
        />
      </PageContainer.ContentTable>
      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInviteMember}
      />
    </PageContainer>
  );
}
