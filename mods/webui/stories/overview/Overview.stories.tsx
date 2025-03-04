import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, styled, Grid } from '@mui/material';
import { OverviewCard } from '../overviewcard/OverviewCard';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import React from "react";

const meta = {
  title: 'Pages/Overview',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

const PageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  width: '1200px',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(6),
}));

const SectionContainer = styled(Box)(({ theme }) => ({
  width: '100%',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: theme.spacing(2),
}));

const CardsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const OverviewTemplate = () => {
  return (
    <PageContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        [Workspace Name] Overview
      </Typography>

      <ContentContainer>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <SectionContainer>
              <SectionTitle>SETTINGS</SectionTitle>
              <CardsContainer>
                <OverviewCard
                  label="Workspace Settings"
                  icon={<SettingsOutlinedIcon />}
                  onClick={() => console.log('Navigate to settings')}
                />
                <OverviewCard
                  label="Workspace Members"
                  icon={<GroupOutlinedIcon />}
                  onClick={() => console.log('Navigate to members')}
                />
              </CardsContainer>
            </SectionContainer>
          </Grid>

          <Grid item xs={12} md={6}>
            <SectionContainer>
              <SectionTitle>API KEYS</SectionTitle>
              <CardsContainer>
                <OverviewCard
                  label="You currently have [3] API Keys"
                  icon={<VpnKeyOutlinedIcon />}
                  onClick={() => console.log('Navigate to API keys')}
                />
                <OverviewCard
                  label="You have 2 API Key that is almost expired"
                  icon={<NotificationsOutlinedIcon />}
                  onClick={() => console.log('Navigate to API keys')}
                />
              </CardsContainer>
            </SectionContainer>
          </Grid>
        </Grid>
      </ContentContainer>
    </PageContainer>
  );
};

export const Default: StoryObj = {
  render: () => <OverviewTemplate />,
}; 