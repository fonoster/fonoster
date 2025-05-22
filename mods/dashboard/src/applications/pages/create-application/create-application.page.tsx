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
import type { Route } from "./+types/create-application.page";
import { useCallback } from "react";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useNavigate } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Icon } from "~/core/components/design-system/icons/icons";
import { Box } from "@mui/material";
import { CreateApplicationForm } from "./create-application.form";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Voice Applications | Fonoster" },
    {
      name: "description",
      content:
        "Use this section to connect your Dialogflow, IBM Watson, and OpenAI Assistants with your numbers."
    }
  ];
}

export default function CreateApplication() {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();

  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/applications`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  return (
    <Page variant="form">
      <PageHeader
        title="Create New Application"
        description="Create a programmable voice application to connect your Telephony infrastructure with your Dialogflow Agents"
        onBack={{ label: "Back to voice applications", onClick: onGoBack }}
        actions={
          <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
            <Button size="small">Save Voice Application</Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                <Icon
                  name="Phone"
                  sx={{
                    fontSize: "16px !important",
                    color: "inherit"
                  }}
                />
              }
            >
              Test Call
            </Button>
          </Box>
        }
      />

      <Box sx={{ maxWidth: "440px" }}>
        <CreateApplicationForm />
      </Box>
    </Page>
  );
}
