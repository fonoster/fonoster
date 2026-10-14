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
import { useCallback, useMemo } from "react";
import { OverviewCard } from "~/workspaces/components/overview-card/overview-card";
import {
  CardsContainer,
  ContentContainer,
  SectionContainer,
  SectionTitle
} from "./overview.styles";
import { useAuth } from "~/auth/hooks/use-auth";
import { useApiKeys } from "~/api-keys/services/api-keys.service";

/**
 * Page metadata function
 *
 * Sets the page title for SEO and browser tab.
 *
 * @param {Route.MetaArgs} _ - Meta args provided by the route loader.
 * @returns {Array} An array containing the page title.
 */
export function meta(_: Route.MetaArgs) {
  return [{ title: "Workspace Overview | Fonoster" }];
}

/**
 * Overview component
 *
 * Renders the workspace overview page with sections for settings and API keys.
 * Displays cards that navigate to different workspace features.
 *
 * @returns {JSX.Element} The rendered overview page.
 */
export default function Overview() {
  /** Retrieves the current workspace ID from the URL params. */
  const workspaceId = useWorkspaceId();

  /** Retrieves the current workspace from the authentication context. */
  const { currentWorkspace } = useAuth();

  /** React Router hook to handle programmatic navigation. */
  const navigate = useNavigate();

  const { data, isLoading } = useApiKeys();

  /**
   * Handles clicking on an overview card.
   * Navigates the user to the corresponding workspace subpage.
   *
   * @param {string} card - The selected card route suffix.
   */
  const handleCardClick = useCallback(
    (card: string) =>
      navigate(`/workspaces/${workspaceId}/${card}`, { viewTransition: true }),
    [navigate, workspaceId]
  );

  /**
   * Generates the page title dynamically based on the current workspace.
   */
  const title = useMemo(() => {
    if (currentWorkspace) {
      return `${currentWorkspace.name} Overview`;
    }
    return "Workspace Overview";
  }, [currentWorkspace]);

  const apiKeysMessage = useMemo(() => {
    if (isLoading) {
      return "Loading API keys...";
    }

    if (data.length === 0) {
      return "You currently have no API Keys";
    }

    return `You currently have [${data.length}] API Keys`;
  }, [data, isLoading]);

  const apiKeysExpiresSoonMessage = useMemo(() => {
    if (isLoading) {
      return "Loading API keys...";
    }

    if (data.length === 0) {
      return "You currently have no API Keys that are about to expire";
    }

    const expiringKeysCount = data.filter(
      (key) =>
        key.expiresAt &&
        new Date(key.expiresAt).getTime() > 0 &&
        new Date(key.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    ).length;

    if (expiringKeysCount === 0) {
      return "You have no API Keys that are about to expire";
    }

    return `You have ${expiringKeysCount} API Key(s) that are about to expire`;
  }, [data, isLoading]);

  /**
   * Renders the overview page layout.
   */
  return (
    <Page>
      <PageHeader title={title} />
      <ContentContainer>
        <Grid container spacing={2} columnSpacing={2}>
          {/* SETTINGS SECTION */}
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

          {/* API KEYS SECTION */}
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <SectionContainer>
              <SectionTitle>API KEYS</SectionTitle>
              <CardsContainer>
                <OverviewCard
                  label={apiKeysMessage}
                  icon={<VpnKeyOutlinedIcon />}
                  onClick={() => handleCardClick("api-keys")}
                />

                <OverviewCard
                  label={apiKeysExpiresSoonMessage}
                  icon={<NotificationsOutlinedIcon />}
                  onClick={() => handleCardClick("api-keys")}
                />
              </CardsContainer>
            </SectionContainer>
          </Grid>
        </Grid>
      </ContentContainer>
    </Page>
  );
}
