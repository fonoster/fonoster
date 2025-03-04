import { Container, styled, Box } from "@mui/material";
import { WorkspaceCard } from "@stories/workspace/WorkspaceCard";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { Typography } from "@stories/typography/Typography";

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  minHeight: `calc(100vh - 80px)`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(6),
  maxWidth: "none !important"
}));

const WorkspaceGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, 344px)",
  justifyContent: "center",
  gridAutoFlow: "row dense",
  gap: theme.spacing(3),
  width: "100%",
  padding: theme.spacing(1),
  margin: "0 auto",
  overflowX: "hidden",
  "@media (max-width: 767px)": {
    gridTemplateColumns: "minmax(300px, 344px)",
    justifyContent: "center"
  }
}));

const ListWorkspacePage = () => {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspaceContext();
  const { setAccessKeyId } = useFonosterClient();

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
      <Typography variant="heading-large">
        Hey [USER], welcome to Fonoster!
      </Typography>
      {/* <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        mt={1}
        mb={2}
      >
        Create a new workspace to begin managing your SIP Network and Programmable Voice Applications.
      </Typography> */}

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
