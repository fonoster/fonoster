import { Box, styled, Grid2 } from "@mui/material";
import { OverviewCard } from "../../../../../stories/overviewcard/OverviewCard";
import { useRouter } from "next/router";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PageContainer from "@/common/components/layout/pages";
import { Typography } from "@stories/typography/Typography";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";

const ContentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(6)
}));

const SectionContainer = styled(Box)(({ theme }) => ({
  width: "100%"
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.75rem",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: theme.spacing(2)
}));

const CardsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2)
}));

export default function OverviewPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { workspaceId } = router.query;

  const handleCardClick = (path: string) => {
    router.push(`/workspace/${workspaceId}/overview/${path}`);
  };

  const apiKeysCount = 3;
  const expiringKeysCount = 2;

  return (
    <PageContainer>
      <PageContainer.Header title={`${selectedWorkspace?.name} Overview`} />
      <ContentContainer>
        <Grid2 container spacing={2} columnSpacing={2}>
          <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
            <SectionContainer>
              <SectionTitle>SETTINGS</SectionTitle>
              <CardsContainer>
                <OverviewCard
                  label="Workspace Settings"
                  icon={<SettingsOutlinedIcon />}
                  onClick={() => handleCardClick("settings")}
                />
                <OverviewCard
                  label="Workspace Members"
                  icon={<GroupOutlinedIcon />}
                  onClick={() => handleCardClick("members")}
                />
              </CardsContainer>
            </SectionContainer>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
            <SectionContainer>
              <SectionTitle>API KEYS</SectionTitle>
              <CardsContainer>
                <OverviewCard
                  label={`You currently have [${apiKeysCount}] API Keys`}
                  icon={<VpnKeyOutlinedIcon />}
                  onClick={() => handleCardClick("api-keys")}
                />
                {expiringKeysCount > 0 && (
                  <OverviewCard
                    label={`You have ${expiringKeysCount} API Key that is almost expired`}
                    icon={<NotificationsOutlinedIcon />}
                    onClick={() => handleCardClick("api-keys")}
                  />
                )}
              </CardsContainer>
            </SectionContainer>
          </Grid2>
        </Grid2>
      </ContentContainer>
    </PageContainer>
  );
}
