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
import type { Route } from "./+types/edit-agent.page";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateAgentForm,
  type CreateAgentFormHandle
} from "../create-agent/create-agent.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { Splash } from "~/core/components/general/splash/splash";
import { useAgent, useUpdateAgent } from "~/agents/services/agents.service";
import type { Schema } from "../create-agent/create-agent.schema";
import { getErrorMessage } from "~/core/helpers/extract-error-message";

/**
 * Sets the metadata for the "Edit Agent" page.
 *
 * This information is used by the router to define the page title and description
 * for SEO and display in the browser.
 *
 * @param _ - Meta arguments provided by the router (unused here).
 * @returns {Array} Metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Edit Agent | Fonoster" },
    {
      name: "description",
      content:
        "SIP Agents in the same Domain can call each other with Voice Over IP using a Software Phone (e.g Zoiper)"
    }
  ];
}

/**
 * EditAgent page component.
 *
 * Renders a page to edit an existing voice agent, including:
 * - Page header with back navigation and save button.
 * - A form pre-filled with the agent details.
 * - Data fetching and optimistic update integration.
 *
 * @returns {JSX.Element} The rendered Edit Agent page.
 */
export default function EditAgent() {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Extracts the agent reference from the URL parameters. */
  const { ref } = useParams();

  /**
   * Ensures the agent reference is provided.
   *
   * This value should never be null or undefined, as it is required
   * to fetch and update the agent data.
   */
  if (!ref) {
    throw new Error("Agent reference is required");
  }

  /** Fetches the existing agent details for editing. */
  const { data, isLoading } = useAgent(ref);

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /** Ref to access the form's imperative handle (submit method). */
  const formRef = useRef<CreateAgentFormHandle>(null);

  /**
   * Handler for navigating back to the agents page.
   * Uses `viewTransition` for smoother transitions.
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/agents`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to handle agent updates via the API. */
  const { mutateAsync, isPending } = useUpdateAgent();

  /**
   * Handler called after form submission.
   * Updates the agent, shows a toast, and navigates back to the agents page.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSave = useCallback(
    async (data: Schema) => {
      try {
        await mutateAsync({ ...data, ref });
        toast("Agent updated successfully!");
        onGoBack();
      } catch (error) {
        toast(getErrorMessage(error));
      }
    },
    [mutateAsync, ref, onGoBack]
  );

  /**
   * Effect that ensures the user is redirected if the agent does not exist.
   * Shows an error toast and navigates back to the agents page.
   */
  useEffect(() => {
    if (!isLoading && !data) {
      toast("Oops! You are trying to edit a agent that does not exist.");
      onGoBack();
    }
  }, [isLoading, data, onGoBack]);

  /**
   * Shows a loading indicator while fetching the agent data.
   */
  if (isLoading || !data) {
    return <Splash message="Loading agent details..." />;
  }

  /**
   * Renders the Edit Agent page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Edit Agent"
        description="SIP Agents in the same Domain can call each other with Voice Over IP using a Software Phone (e.g Zoiper)"
        onBack={{ label: "Back to agents", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled || isPending}
          >
            {isPending ? "Saving..." : "Save Agent"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateAgentForm
          ref={formRef}
          onSubmit={onSave}
          initialValues={{ maxContacts: 10, ...data }}
        />
      </Box>
    </Page>
  );
}
