/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Grid } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import type { Route } from "./+types/overview.page";
import { Page } from "~/core/components/general/page/page";
import { PageHeader } from "~/core/components/general/page/page-header";
import { useNavigate } from "react-router";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useCallback } from "react";
import { OverviewCard } from "~/workspaces/components/overview-card/overview-card";
import {
  CardsContainer,
  ContentContainer,
  SectionContainer,
  SectionTitle
} from "./overview.styles";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Workspace Overview | Fonoster" }];
}

export default function Overview() {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const apiKeysCount = 3;
  const expiringKeysCount = 2;

  const handleCardClick = useCallback(
    (card: string) =>
      navigate(`/workspaces/${workspaceId}/${card}`, { viewTransition: true }),
    [navigate, workspaceId]
  );

  return (
    <Page>
      <PageHeader title="[Workspace Name] Overview" />
      <ContentContainer>
        <Grid container spacing={2} columnSpacing={2}>
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
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
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
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
          </Grid>
        </Grid>
      </ContentContainer>
    </Page>
  );
}
