import { Container, styled, Box } from "@mui/material";
import { WorkspaceCard } from "@stories/workspace/WorkspaceCard";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { Typography } from "@stories/typography/Typography";
import { useUser } from "@/common/sdk/hooks/useUser";
import { useEffect, useState } from "react";
import { User } from "@/types/user";
import { CreateWorkspaceModal } from "./_components/CreateWorkspaceModal";

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: "none !important",
  padding: theme.spacing(8),
  overflow: "auto"
}));

const WorkspaceGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, 344px)",
  justifyContent: "center",
  gridAutoFlow: "row dense",
  gap: theme.spacing(3),
  width: "100%",
  padding: theme.spacing(6),
  margin: "0 auto",
  "@media (max-width: 767px)": {
    gridTemplateColumns: "minmax(300px, 344px)",
    justifyContent: "center",
    padding: theme.spacing(2)
  }
}));

const ListWorkspacePage = () => {
  const router = useRouter();
  const { workspaces, refreshWorkspaces, handleSetSelectedWorkspace } =
    useWorkspaceContext();
  const { setAccessKeyId } = useFonosterClient();
  const { loggedUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const logged = await loggedUser();
      setUser(logged ? (logged as unknown as User) : null);
    };
    fetchUser();
  }, []);

  const handleCreateWorkspace = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateSuccess = () => {
    refreshWorkspaces();
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    setAccessKeyId(workspaceId);
    handleSetSelectedWorkspace(workspaceId);
    router.push(`/workspace/${workspaceId}/overview`);
  };

  return (
    <WorkspaceContainer>
      <Typography
        variant="heading-large"
        sx={{ mt: 2, color: "text.secondary" }}
      >
        {user?.name
          ? `Hey ${user?.name}, welcome to Fonoster! 👋`
          : "Welcome to Fonoster! 👋"}
      </Typography>

      <Typography
        variant="body-large"
        sx={{ color: "text.secondary", mt: 2, mb: 2, maxWidth: 500 }}
        textAlign="center"
      >
        {
          "Create a new workspace to begin managing your SIP Network and Programmable Voice Applications."
        }
      </Typography>

      <WorkspaceGrid>
        {workspaces
          .filter((workspace) => workspace && workspace.ref)
          .map((workspace) => (
            <WorkspaceCard
              key={workspace.ref}
              variant="regular"
              region={process.env.NEXT_PUBLIC_FONOSTER_REGION || "NYC01"}
              description={workspace.name}
              date={
                workspace.createdAt
                  ? workspace.createdAt.toLocaleDateString()
                  : "N/A"
              }
              onClick={() => handleWorkspaceClick(workspace.ref)}
              disabled={false}
            />
          ))}

        <WorkspaceCard
          variant="empty"
          onClick={handleCreateWorkspace}
          disabled={false}
        />
      </WorkspaceGrid>
      <CreateWorkspaceModal
        open={isCreateModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
      />
    </WorkspaceContainer>
  );
};

export default ListWorkspacePage;
