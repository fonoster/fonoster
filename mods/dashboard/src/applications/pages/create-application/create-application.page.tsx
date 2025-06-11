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
import { useCallback, useRef } from "react";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useNavigate } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Icon } from "~/core/components/design-system/icons/icons";
import { Box } from "@mui/material";
import {
  CreateApplicationForm,
  type CreateApplicationFormHandle,
  type Schema
} from "./create-application.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useCreateApplication } from "~/applications/services/applications.service";

/**
 * Sets the metadata for the "Create Application" page.
 * Used by the router to define the page title and description.
 *
 * @param _ - Meta arguments (unused).
 * @returns Array of meta objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Voice Applications | Fonoster" },
    {
      name: "description",
      content:
        "Manage your External and Autopilot applications here. Autopilot uses LLMs; External lets you run custom logic."
    }
  ];
}

/**
 * Page component for creating a new voice application.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for application details.
 *  - Save and Test Call actions.
 */
export default function CreateApplication() {
  /** Retrieves the current workspace ID for navigation. */
  const workspaceId = useWorkspaceId();

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /** Ref to access the form's imperative handle (submit method). */
  const formRef = useRef<CreateApplicationFormHandle>(null);

  /**
   * Handler for navigating back to the voice applications page.
   * Uses `viewTransition` for smoother page transitions.
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/applications`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to handle application creation with optimistic updates. */
  const { mutate, isPending } = useCreateApplication();

  /**
   * Handler called after form submission.
   * Currently displays a success toast; in real usage, it could call an API.
   *
   * @param data - The validated form data.
   */
  const onSave = useCallback(async (data: Schema) => {
    try {
      mutate(data);
      toast("Application created successfully!");
      onGoBack();
    } catch (error) {
      toast("Oops! Something went wrong while creating the application.");
    }
  }, []);

  const onTestCall = useCallback(() => {
    // Placeholder for future functionality to test the application with a call
    toast("Test call functionality is not yet implemented.");
  }, []);

  return (
    <Page variant="form">
      <PageHeader
        title="Create New Application"
        description="Create a programmable voice application to connect your Telephony infrastructure with your Dialogflow Agents"
        onBack={{ label: "Back to voice applications", onClick: onGoBack }}
        actions={
          <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
            {/* Save Button triggers the form submit via ref */}
            <Button
              size="small"
              onClick={() => formRef.current?.submit()}
              disabled={formRef.current?.isSubmitDisabled || isPending}
            >
              {isPending ? "Saving..." : "Save Voice Application"}
            </Button>

            {/* Test Call button (currently non-functional) */}
            <Button
              onClick={onTestCall}
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

      {/* Form container with a max width for readability */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateApplicationForm ref={formRef} onSubmit={onSave} />
      </Box>
    </Page>
  );
}
