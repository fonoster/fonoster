import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceCard } from './WorkspaceCard';
import { Box, Typography, Paper, styled } from '@mui/material';
import React from 'react';
import { fn } from '@storybook/test';

const meta = {
  title: 'Workspace/WorkspaceList',
  component: WorkspaceCard,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof WorkspaceCard>;

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

export default meta;
type Story = StoryObj<typeof meta>;

const WorkspaceGrid = () => {
  const mockWorkspaces = [
    {
      id: 'workspace-1',
      region: 'us-east',
      description: 'Demo Workspace With Wrapping Title.',
      date: '01/14/24',
    },
    {
      id: 'workspace-2',
      region: 'eu-central',
      description: 'Another Workspace Example',
      date: '01/15/24',
    },
  ];

  const handleWorkspaceClick = fn((workspaceId: string) => {
    console.log('Navigate to:', `/workspace/${workspaceId}/overview`);
  });

  const handleSettingsClick = fn((e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    console.log('Navigate to:', `/workspace/${workspaceId}/settings`);
  });

  return (
    <Box sx={{ width: '100%', maxWidth: '1000px', p: 3 }}>
      <Typography variant="h4" component="h1" align="center">
        Workspaces
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ mt: 1, mb: 2 }}
      >
        Create a new workspace to begin managing your SIP Network and Programmable Voice Applications.
      </Typography>

      <CardContainer>
        <VerifyCard>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 3,
              width: '100%',
            }}
          >
            {mockWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                variant="regular"
                region={workspace.region}
                description={workspace.description}
                date={workspace.date}
                onClick={() => handleWorkspaceClick(workspace.id)}
                onSettingsClick={(e) => handleSettingsClick(e, workspace.id)}
                disabled={false}
              />
            ))}
            <WorkspaceCard
              variant="empty"
              onClick={fn(() => console.log('Create new workspace'))}
              disabled={false}
            />
          </Box>
        </VerifyCard>
      </CardContainer>
    </Box>
  );
};

export const Default: Story = {
  render: () => <WorkspaceGrid />,
};

export const EmptyCard: Story = {
  args: {
    variant: 'empty',
    onClick: fn(() => console.log('Create new workspace')),
    disabled: false,
  },
};

export const WorkspaceCardExample: Story = {
  args: {
    variant: 'regular',
    region: 'us-east',
    description: 'Demo Workspace With Wrapping Title.',
    date: '01/14/24',
    onClick: fn(() => console.log('Workspace clicked')),
    onSettingsClick: fn(() => console.log('Settings clicked')),
    disabled: false,
  },
}; 