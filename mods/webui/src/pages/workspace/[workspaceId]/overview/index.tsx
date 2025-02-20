import { useWorkspaces } from '@/common/sdk/hooks/useWorkspaces';
import { Box, Typography, styled, Grid } from '@mui/material';
import { OverviewCard } from '../../../../../stories/overviewcard/OverviewCard';
import { useRouter } from 'next/router';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useEffect, useState } from 'react';
import {
  BaseApiObject,
} from '@fonoster/types'
import PageContainer from '@/common/components/layout/pages';

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
  const { isReady, getWorkspace } = useWorkspaces();
  const { workspaceId } = router.query;
  const [workspace, setWorkspace] = useState<BaseApiObject | null>(null);
  const [loading, setLoading] = useState(true);

  const handleCardClick = (path: string) => {
    router.push(`/workspace/${workspaceId}/overview/${path}`);
  };

  const apiKeysCount = 3;
  const expiringKeysCount = 2;


  useEffect(() => {
    let mounted = true;

    const fetchWorkspaces = async () => {
      if (!isReady || !mounted) return;

      try {
        const response = await getWorkspace(workspaceId as string);
        if (!mounted) return;
        if (!response) return;

        if (mounted) {
          setWorkspace(response);
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

  return (
    <PageContainer>
      <PageContainer.Header title="Workspace Overview" />
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
    </PageContainer>
  );
} 