import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useState } from "react";
import { InviteMemberModal } from "@/pages/workspace/_components/InviteMemberModal";
import { MemberDTO } from "@/types/dto/workspace/MemberDTO";
import QueryMembers from "./_components/queryMembers";

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
            variant="contained"
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite new member
          </Button>
        }
        backTo={{
          label: "Back to Overview",
          onClick: () => router.push(`/workspace/${workspaceId}/overview`)
        }}
      />
      <PageContainer.Subheader>
        Manage your workspace members and their roles.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<MemberDTO>
        columns={columns}
        tableId="members-table"
      >
        <QueryMembers />
      </PageContainer.ContentTable>

      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInviteMember}
      />
    </PageContainer>
  );
}
