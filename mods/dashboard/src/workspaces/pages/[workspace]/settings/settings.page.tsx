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
import { useCallback } from "react";
import { WorkspaceSettingsForm } from "./settings.form";
import { Box, Stack } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Button } from "~/core/components/design-system/ui/button/button";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Workspace Settings | Fonoster" }];
}

export default function Overview() {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();

  const onClick = useCallback(() => {
    navigate(`/workspaces/${workspaceId}`, { viewTransition: true });
  }, [navigate, workspaceId]);

  return (
    <Page variant="form">
      <PageHeader
        title="Workspace Settings"
        onBack={{ label: "Back to overview", onClick }}
        actions={<Button size="small">Save Workspace Settings</Button>}
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
          <Typography variant="body-micro" sx={{ color: "base.04" }}>
            NYC01
          </Typography>
          <Typography variant="heading-micro">[Workspace Name]</Typography>
        </Stack>
        <WorkspaceSettingsForm />
      </Box>
    </Page>
  );
}
