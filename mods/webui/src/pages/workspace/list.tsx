import { useState } from 'react';
import { Container, styled, Typography, Box, Paper } from '@mui/material';
import { Layout } from '@/common/component/layout/Layout';
import { WorkspaceCard } from '../../../stories/workspace/WorkspaceCard';
import { useRouter } from 'next/router';

// Reusing styles from create.tsx
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
  maxWidth: 800,
  margin: 'auto',
  padding: theme.spacing(6),
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing(3),
  width: '100%',
}));

const ListWorkspacePage = () => {
  const router = useRouter();
  const [workspaces] = useState([
    {
      region: 'us-east',
      description: 'Demo Workspace With Wrapping Title.',
      date: '01/14/24',
    },
    // Add more workspaces as needed
  ]);

  const handleCreateWorkspace = () => {
    router.push('/workspace/create');
  };

  const handleWorkspaceClick = (index: number) => {
    // Handle workspace click
    console.log('Clicked workspace:', index);
  };

  const handleSettingsClick = () => {
    // Handle settings click
    console.log('Settings clicked');
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
              {workspaces.map((workspace, index) => (
                <WorkspaceCard
                  key={index}
                  variant="regular"
                  region={workspace.region}
                  description={workspace.description}
                  date={workspace.date}
                  onClick={() => handleWorkspaceClick(index)}
                  onSettingsClick={handleSettingsClick}
                  disabled={false}
                />
              ))}
              <WorkspaceCard
                variant="empty"
                onClick={handleCreateWorkspace}
                disabled={false}
              />
            </WorkspaceGrid>
          </VerifyCard>
        </CardContainer>
      </WorkspaceContainer>
    </Layout>
  );
};

export default ListWorkspacePage; 