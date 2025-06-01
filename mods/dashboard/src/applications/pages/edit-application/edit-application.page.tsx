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
import type { Route } from "./+types/edit-application.page";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Icon } from "~/core/components/design-system/icons/icons";
import { Box } from "@mui/material";
import {
  CreateApplicationForm,
  type CreateApplicationFormHandle,
  type Schema
} from "../create-application/create-application.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import {
  useApplication,
  useUpdateApplication
} from "~/applications/services/applications.service";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { Splash } from "~/core/components/general/splash/splash";

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
        "Use this section to connect your Dialogflow, IBM Watson, and OpenAI Assistants with your numbers."
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
export default function EditApplication() {
  /** Retrieves the current workspace ID for navigation. */
  const workspaceId = useWorkspaceId();

  /** Extracts the application reference from the URL parameters. */
  const { ref } = useParams();

  /**
   * Ensures the application reference is provided.
   *
   * Thhis never should be null or undefined, as it is required to fetch the application data.
   */
  if (!ref) {
    throw new Error("Application reference is required");
  }

  /** Custom hook to fetch and manage application data. */
  const { data, isLoading } = useApplication(ref);

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
  const { mutate, isPending } = useUpdateApplication();

  /**
   * Handler called after form submission.
   * Currently displays a success toast; in real usage, it could call an API.
   *
   * @param data - The validated form data.
   */
  const onSave = useCallback(async (data: Schema) => {
    try {
      mutate(data);
      toast("Application updated successfully!");
      onGoBack();
    } catch (error) {
      toast("Oops! Something went wrong while updating the application.");
    }
  }, []);

  const onTestCall = useCallback(() => {
    // Placeholder for future functionality to test the application with a call
    toast("Test call functionality is not yet implemented.");
  }, []);

  useEffect(() => {
    // If the application data is not yet loaded, we don't render the form
    if (!isLoading && !data) {
      toast("Oops! You are trying to edit an application that does not exist.");
      onGoBack();
    }
  }, [isLoading, data, onGoBack]);

  if (isLoading || !data) {
    return <Splash message="Loading application details..." />;
  }

  return (
    <Page variant="form">
      <PageHeader
        title="Edit Application"
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
        <CreateApplicationForm
          ref={formRef}
          onSubmit={onSave}
          initialValues={data}
        />
      </Box>
    </Page>
  );
}
