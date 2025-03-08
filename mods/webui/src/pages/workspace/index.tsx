import { Container, styled, Box } from "@mui/material";
import { WorkspaceCard } from "@stories/workspace/WorkspaceCard";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { Typography } from "@stories/typography/Typography";
import { useUser } from "@/common/sdk/hooks/useUser";
import { useEffect, useState } from "react";
import { User } from "@/types/user";

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: "none !important",
  padding: theme.spacing(10),
  overflow: "auto"
}));

const WorkspaceGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, 344px)",
  justifyContent: "center",
  gridAutoFlow: "row dense",
  gap: theme.spacing(3),
  width: "100%",
  padding: theme.spacing(10),
  margin: "0 auto",
  "@media (max-width: 767px)": {
    gridTemplateColumns: "minmax(300px, 344px)",
    justifyContent: "center",
    padding: theme.spacing(2)
  }
}));

const ListWorkspacePage = () => {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspaceContext();
  const { setAccessKeyId } = useFonosterClient();
  const { loggedUser } = useUser();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const logged = await loggedUser();
      setUser(logged ? (logged as unknown) as User : null);
    };
    fetchUser();
  }, []);

  const handleCreateWorkspace = () => {
    router.push("/workspace/create");
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    setAccessKeyId(workspaceId);
    router.push(`/workspace/${workspaceId}/overview`);
  };

  const handleSettingsClick = (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    setAccessKeyId(workspaceId);
    router.push(`/workspace/${workspaceId}/overview/settings`);
  };

  return (
    <WorkspaceContainer>
      <Typography variant="heading-medium">
        {`Hey ${user?.name}, welcome to Fonoster!`}
      </Typography>
      <Typography
        variant="body-large"
        color="text.secondary"
        align="center"
        mt={1}
        mb={2}
      >
        Create a new workspace to begin managing your SIP Network and Programmable Voice Applications.
      </Typography>
      <WorkspaceGrid>
        {isLoading ? (
          <Typography>Loading workspaces...</Typography>
        ) : (
          <>
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.ref}
                variant="regular"
                region={
                  workspace.region || process.env.NEXT_PUBLIC_FONOSTER_REGION
                }
                description={workspace.name}
                date={workspace.createdAt.toLocaleDateString()}
                onClick={() => handleWorkspaceClick(workspace.ref)}
                onSettingsClick={(e) => handleSettingsClick(e, workspace.ref)}
                disabled={false}
              />
            ))}
            <WorkspaceCard
              variant="empty"
              onClick={handleCreateWorkspace}
              disabled={false}
            />
          </>
        )}
      </WorkspaceGrid>
    </WorkspaceContainer>
  );
};

export default ListWorkspacePage;
