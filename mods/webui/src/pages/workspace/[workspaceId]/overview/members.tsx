import PageContainer from "@/common/components/layout/pages";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useState } from "react";
import { InviteMemberModal } from "@/pages/workspace/_components/InviteMemberModal";
import { MemberDTO } from "@/types/dto/workspace/MemberDTO";
import QueryMembers from "./_components/queryMembers";
import { Button } from "@stories/button/Button";
import { Icon } from "@stories/icon/Icon";
import { QueryData } from "@/common/contexts/table/QueryData";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";
import { ListWorkspaceMembersResponse } from "@fonster/types";

const columns: ColumnDef<MemberDTO>[] = [
  {
    accessorKey: "name",
    header: "NAME",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "email",
    header: "EMAIL",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "role",
    header: "ROLE",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "role",
    header: "DATE ADDED",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "actions",
    header: "ACTIONS",
    cell: (info: any) => info.getValue()
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
        showFilters={false}
        showSearch={false}
        showPagination={true}
      >
        <QueryData<ListWorkspaceMembersResponse> fetchFunction={listWorkspaceMembers} pageSize={10} />
      </PageContainer.ContentTable>
      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInviteMember}
      />
    </PageContainer>
  );
}
