import { useState, useEffect } from 'react';
import { Container, styled, Typography, Box, Paper } from '@mui/material';
import { Layout } from '@/common/components/layout/Layout';
import { WorkspaceCard } from '../../../stories/workspace/WorkspaceCard';
import { useRouter } from 'next/router';
import { useWorkspaces } from '@/common/sdk/hooks/useWorkspaces';

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  minHeight: `calc(100vh - 80px)`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: 80,
  maxWidth: '1000px !important',
  padding: theme.spacing(3),
}));

const CardContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  marginTop: 24,
});

const VerifyCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '100%',
  margin: 'auto',
  padding: theme.spacing(6),
  overflowX: 'auto',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.palette.mode === 'light'
    ? '0px 3px 15px rgba(0, 0, 0, 0.1)'
    : '0px 3px 15px rgba(0, 0, 0, 0.4)',
  transition: theme.transitions.create(['box-shadow']),
  '&:hover': {
    boxShadow: theme.palette.mode === 'light'
      ? '0px 4px 20px rgba(0, 0, 0, 0.15)'
      : '0px 4px 20px rgba(0, 0, 0, 0.5)',
  },
}));

const WorkspaceGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 250px)',
  gridAutoFlow: 'row dense',
  gap: theme.spacing(3),
  width: '100%',
  overflowX: 'auto',
  padding: theme.spacing(1),
  '@media (max-width: 600px)': {
    gridAutoFlow: 'row',
    gridTemplateColumns: '1fr',
  }
}));

interface Workspace {
  id: string;
  region: string;
  description: string;
  date: string;
}

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
        if (!mounted) return;
        if (!response) return;
        
        const { items } = response;
        const formattedWorkspaces = items.map(workspace => ({
          ref: workspace.ref,
          region: workspace.region || process.env.NEXT_PUBLIC_FONOSTER_REGION,
          description: workspace.name || 'No description',
          date: new Date(workspace.createdAt).toLocaleDateString(),
        }));

        if (mounted) {
          setWorkspaces(formattedWorkspaces);
        }
      } catch (error) {
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
  }, [isReady]);

  const handleCreateWorkspace = () => {
    router.push('/workspace/create');
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}/overview`);
  };

  const handleSettingsClick = (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    router.push(`/workspace/${workspaceId}/settings`);
  };

  return (
    <Layout>
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

        <CardContainer>
          <VerifyCard>
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
                      onSettingsClick={(e: React.MouseEvent) => handleSettingsClick(e, workspace.ref)}
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
          </VerifyCard>
        </CardContainer>
      </WorkspaceContainer>
    </Layout>
  );
};

export default ListWorkspacePage; 