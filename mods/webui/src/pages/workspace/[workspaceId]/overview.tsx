import { Box, Typography, styled, Grid } from '@mui/material';
import { OverviewCard } from '../../../../stories/overviewcard/OverviewCard';
import { useRouter } from 'next/router';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { PageContainer } from '@toolpad/core/PageContainer';

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

export default function OverviewPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  const handleCardClick = (path: string) => {
    router.push(`/workspace/${workspaceId}/${path}`);
  };

  // Mock data - In a real app, this would come from an API
  const apiKeysCount = 3;
  const expiringKeysCount = 2;

  return (
    <PageContainer>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {workspaceId} Overview
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
                    onClick={() => handleCardClick('settings')}
                  />
                  <OverviewCard
                    label="Workspace Members"
                    icon={<GroupOutlinedIcon />}
                    onClick={() => handleCardClick('members')}
                  />
                </CardsContainer>
              </SectionContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionContainer>
                <SectionTitle>API KEYS</SectionTitle>
                <CardsContainer>
                  <OverviewCard
                    label={`You currently have [${apiKeysCount}] API Keys`}
                    icon={<VpnKeyOutlinedIcon />}
                    onClick={() => handleCardClick('api-keys')}
                  />
                  {expiringKeysCount > 0 && (
                    <OverviewCard
                      label={`You have ${expiringKeysCount} API Key that is almost expired`}
                      icon={<NotificationsOutlinedIcon />}
                      onClick={() => handleCardClick('api-keys')}
                    />
                  )}
                </CardsContainer>
              </SectionContainer>
            </Grid>
          </Grid>
        </ContentContainer>
      </Box>
    </PageContainer>
  );
} 