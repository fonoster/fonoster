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

/**
 * Header component for the Voice Domains page.
 * Displays the page title, description, and a button to create a new domain.
 */
export function DomainsPageHeader() {
  /** Provides navigation functionality from react-router. */
  const navigate = useNavigate();

  /** Retrieves the current workspace ID from context or hook. */
  const workspaceId = useWorkspaceId();

  /**
   * Navigates to the domain creation page for the current workspace.
   * Wrapped in useCallback for memoization and performance optimization.
   */
  const onCreateNewDomain = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/domains/create`, {
      viewTransition: true // Enables smooth page transition animations
    });
  }, [navigate, workspaceId]);

  return (
    <PageHeader
      title="Domains"
      description="Group SIP Agents under a domain (e.g., office, home) to simplify internal VoIP routing."
      actions={
        <Button
          variant="outlined"
          size="small"
          onClick={onCreateNewDomain}
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
          Create New Domain
        </Button>
      }
    />
  );
}
