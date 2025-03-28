import PageContainer from "@/common/components/layout/pages";
import { useRouter } from "next/router";
import { useState } from "react";
import { InviteMemberModal } from "@/pages/workspace/_components/InviteMemberModal";
import { Button } from "@stories/button/Button";
import { Icon } from "@stories/icon/Icon";
import MembersTable from "./_components/members-table";
import { WorkspaceMemberDTO } from "@/types/dto/workspace/WorkspaceMemberDTO";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";

export default function MembersPage() {
  const router = useRouter();
  const { workspaceId } = router.query;
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { deleteWorkspace, resendWorkspaceMembershipInvitation } =
    useWorkspaces();

  const handleInviteMember = (data: any) => {
    console.log("Invite member data:", data);
    setIsInviteModalOpen(false);
  };

  const handleDeleteMember = async (data: WorkspaceMemberDTO) => {
    const response = await deleteWorkspace(data.ref);
    alert("Member deleted successfully");
  };

  const handleSendEmail = async (data: WorkspaceMemberDTO) => {
    const response = await resendWorkspaceMembershipInvitation(data.userRef);
    alert("Email sent successfully");
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

      <MembersTable
        onDelete={handleDeleteMember}
        onSendEmail={handleSendEmail}
      />
      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInviteMember}
      />
    </PageContainer>
  );
}
