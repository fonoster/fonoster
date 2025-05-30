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
import { Page } from "~/core/components/general/page/page";
import { PageHeader } from "~/core/components/general/page/page-header";
import type { Route } from "./+types/settings.page";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useNavigate } from "react-router";
import { useCallback, useMemo, useRef } from "react";
import {
  WorkspaceSettingsForm,
  type WorkspaceSettingsFormHandle
} from "./settings.form";
import { Box, Stack } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Button } from "~/core/components/design-system/ui/button/button";
import { useAuth } from "~/auth/hooks/use-auth";

/**
 * Page metadata function.
 *
 * Sets the page title for SEO and browser tab.
 *
 * @param {Route.MetaArgs} _ - Meta args provided by the route loader.
 * @returns {Array} An array containing the page title.
 */
export function meta(_: Route.MetaArgs) {
  return [{ title: "Workspace Settings | Fonoster" }];
}

/**
 * Overview component (Workspace Settings Page).
 *
 * Renders the workspace settings form, allowing users to modify
 * workspace configuration and save changes. Includes a back navigation
 * button and a dynamic title based on the current workspace.
 *
 * @returns {JSX.Element} The rendered workspace settings page.
 */
export default function Overview() {
  /** Retrieves the current workspace ID from the URL params. */
  const workspaceId = useWorkspaceId();

  /** React Router hook to navigate programmatically. */
  const navigate = useNavigate();

  /** Retrieves the current workspace from the authentication context. */
  const { currentWorkspace } = useAuth();

  /** Ref to access the form's imperative handle (e.g., submit method, isSubmitDisabled). */
  const formRef = useRef<WorkspaceSettingsFormHandle>(null);

  /**
   * Handler for the "Back to overview" button.
   * Navigates the user to the workspace overview page.
   */
  const onClick = useCallback(() => {
    navigate(`/workspaces/${workspaceId}`, { viewTransition: true });
  }, [navigate, workspaceId]);

  /**
   * Generates the page title dynamically based on the current workspace.
   * Falls back to "Loading..." if workspace data is not yet available.
   */
  const title = useMemo(() => {
    if (!currentWorkspace) return "Loading...";
    return currentWorkspace.name || "Workspace Settings";
  }, [currentWorkspace]);

  /**
   * Renders the workspace settings page with a header, workspace info, and settings form.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Workspace Settings"
        onBack={{ label: "Back to overview", onClick }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled}
          >
            Save Workspace Settings
          </Button>
        }
      />

      <Box sx={{ maxWidth: "440px" }}>
        <Stack
          sx={{
            marginBottom: "24px",
            display: "flex",
            gap: "10px",
            flexDirection: "column"
          }}
        >
          {/* Displays the workspace region (hardcoded as NYC01) */}
          <Typography variant="body-micro" sx={{ color: "base.04" }}>
            NYC01
          </Typography>

          {/* Displays the workspace title */}
          <Typography variant="heading-micro">{title}</Typography>
        </Stack>

        {/* Workspace Settings Form */}
        <WorkspaceSettingsForm ref={formRef} />
      </Box>
    </Page>
  );
}
