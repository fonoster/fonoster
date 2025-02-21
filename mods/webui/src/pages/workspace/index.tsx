import { useState, useEffect } from 'react';
import { Container, styled, Typography, Box } from '@mui/material';
import { WorkspaceCard } from '@stories/workspace/WorkspaceCard';
import { useRouter } from 'next/router';
import { useWorkspaces } from '@/common/sdk/hooks/useWorkspaces';
import { Workspace } from '@fonoster/types';

import * as SDK from '@fonoster/sdk';

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  minHeight: `calc(100vh - 80px)`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(6),
  maxWidth: 'none !important',
}));

const WorkspaceGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, 344px)',
  justifyContent: 'center',
  gridAutoFlow: 'row dense',
  gap: theme.spacing(3),
  width: '100%',
  padding: theme.spacing(1),
  margin: '0 auto',
  overflowX: 'hidden',
  '@media (max-width: 767px)': {
    gridTemplateColumns: 'minmax(300px, 344px)',
    justifyContent: 'center'
  }
}));

const ListWorkspacePage = () => {
  const router = useRouter();
  const { isReady, listWorkspaces } = useWorkspaces();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchWorkspaces = async () => {
      if (!isReady || !mounted) return;
      try {
        const response = await listWorkspaces();
        if (!mounted || !response) return;

        const { items } = response;
        const formattedWorkspaces: Workspace[] = items.map(workspace => ({
          ref: workspace.ref,
          region: workspace.region || process.env.NEXT_PUBLIC_FONOSTER_REGION,
          name: workspace.name,
          description: workspace.name || 'No description',
          date: new Date(workspace.createdAt).toLocaleDateString(),
          createdAt: workspace.createdAt
        }));
        console.log(formattedWorkspaces)
        const accessKeyId = items[0].ref
        console.log(accessKeyId, 'accessKeyId')

        const client = new SDK.WebClient({ accessKeyId });
        const apps = new SDK.Applications(client);
        const responseApps = await apps.listApplications({});
        console.log(responseApps, 'responseApps')

        if (mounted) {
          setWorkspaces(formattedWorkspaces);
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchWorkspaces();

    return () => {
      mounted = false;
    };
  }, [isReady, listWorkspaces]);

  const handleCreateWorkspace = () => {
    router.push('/workspace/create');
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}/overview`);
  };

  const handleSettingsClick = (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    router.push(`/workspace/${workspaceId}/overview/settings`);
  };

  return (
    <WorkspaceContainer>
      <Typography variant="h4" component="h1" align="center">
        Workspaces
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        mt={1}
        mb={2}
      >
        Create a new workspace to begin managing your SIP Network and Programmable Voice Applications.
      </Typography>

      <WorkspaceGrid>
        {loading ? (
          <Typography>Loading workspaces...</Typography>
        ) : (
          <>
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.ref}
                variant="regular"
                region={workspace.region}
                description={workspace.description}
                date={workspace.date}
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
