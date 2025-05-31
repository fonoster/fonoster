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
import type { Route } from "./+types/edit-number.page";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateNumberForm,
  type CreateNumberFormHandle,
  type Schema
} from "../create-number/create-number.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useNumber, useUpdateNumber } from "~/numbers/services/numbers.service";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { Splash } from "~/core/components/general/splash/splash";

/**
 * Sets the metadata for the "Edit Number" page.
 *
 * This information is used by the router to define the page title and description
 * for SEO and display in the browser.
 *
 * @param _ - Meta arguments provided by the router (unused here).
 * @returns {Array} Metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Numbers | Fonoster" },
    {
      name: "description",
      content:
        "Edit a number to handle incoming and outgoing calls. Use this section to manage your numbers and control their settings."
    }
  ];
}

/**
 * EditNumber page component.
 *
 * Renders a page to edit an existing voice number, including:
 * - Page header with back navigation and save button.
 * - A form pre-filled with the number details.
 * - Data fetching and optimistic update integration.
 *
 * @returns {JSX.Element} The rendered Edit Number page.
 */
export default function EditNumber() {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Extracts the number reference from the URL parameters. */
  const { ref } = useParams();

  /**
   * Ensures the number reference is provided.
   *
   * This value should never be null or undefined, as it is required
   * to fetch and update the number data.
   */
  if (!ref) {
    throw new Error("Number reference is required");
  }

  /** Fetches the existing number details for editing. */
  const { data, isLoading } = useNumber(ref);

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /** Ref to access the form's imperative handle (submit method). */
  const formRef = useRef<CreateNumberFormHandle>(null);

  /**
   * Handler for navigating back to the numbers page.
   * Uses `viewTransition` for smoother transitions.
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/numbers`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to handle number updates via the API. */
  const { mutate, isPending } = useUpdateNumber();

  /**
   * Handler called after form submission.
   * Updates the number, shows a toast, and navigates back to the numbers page.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSave = useCallback(
    async (data: Schema) => {
      try {
        mutate({ ...data, ref });
        toast("Number updated successfully!");
        onGoBack();
      } catch (error) {
        toast("Oops! Something went wrong while updating the number.");
      }
    },
    [mutate, ref, onGoBack]
  );

  /**
   * Effect that ensures the user is redirected if the number does not exist.
   * Shows an error toast and navigates back to the numbers page.
   */
  useEffect(() => {
    if (!isLoading && !data) {
      toast("Oops! You are trying to edit a number that does not exist.");
      onGoBack();
    }
  }, [isLoading, data, onGoBack]);

  /**
   * Shows a loading indicator while fetching the number data.
   */
  if (isLoading || !data) {
    return <Splash message="Loading number details..." />;
  }

  /**
   * Renders the Edit Number page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Edit Number"
        description="Edit a number to handle incoming and outgoing calls. Use this section to manage your numbers and control their settings."
        onBack={{ label: "Back to voice numbers", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled || isPending}
          >
            {isPending ? "Saving..." : "Save Number"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateNumberForm
          ref={formRef}
          onSubmit={onSave}
          initialValues={data}
        />
      </Box>
    </Page>
  );
}
