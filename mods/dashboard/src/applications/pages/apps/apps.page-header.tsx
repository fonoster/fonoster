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
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Icon } from "~/core/components/design-system/icons/icons";
import { Button } from "~/core/components/design-system/ui/button/button";
import { PageHeader } from "~/core/components/general/page/page-header";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";

export function ApplicationsPageHeader() {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();

  const onCreateNewApplication = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/applications/create`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  return (
    <PageHeader
      title="Voice Applications"
      description="Use this section to connect your Dialogflow, IBM Watson, and OpenAI Assistants with your numbers."
      actions={
        <Button
          variant="outlined"
          size="small"
          onClick={onCreateNewApplication}
          endIcon={
            <Icon
              name="Add"
              sx={{
                fontSize: "16px !important",
                color: "inherit"
              }}
            />
          }
        >
          Create New Application
        </Button>
      }
    />
  );
}
