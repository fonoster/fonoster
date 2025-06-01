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
import type { Route } from "./+types/edit-credential.page";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateCredentialForm,
  type CreateCredentialFormHandle
} from "../create-credential/create-credential.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { Splash } from "~/core/components/general/splash/splash";
import {
  useCredential,
  useUpdateCredential
} from "~/credentials/services/credentials.service";
import type { Schema } from "../create-credential/create-credential.schema";

/**
 * Sets the metadata for the "Edit Credential" page.
 *
 * This information is used by the router to define the page title and description
 * for SEO and display in the browser.
 *
 * @param _ - Meta arguments provided by the router (unused here).
 * @returns {Array} Metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Credentials | Fonoster" },
    {
      name: "description",
      content: "Edit a credential to protect your domains, peers, and trunks."
    }
  ];
}

/**
 * EditCredential page component.
 *
 * Renders a page to edit an existing voice credential, including:
 * - Page header with back navigation and save button.
 * - A form pre-filled with the credential details.
 * - Data fetching and optimistic update integration.
 *
 * @returns {JSX.Element} The rendered Edit Credential page.
 */
export default function EditCredential() {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Extracts the credential reference from the URL parameters. */
  const { ref } = useParams();

  /**
   * Ensures the credential reference is provided.
   *
   * This value should never be null or undefined, as it is required
   * to fetch and update the credential data.
   */
  if (!ref) {
    throw new Error("Credential reference is required");
  }

  /** Fetches the existing credential details for editing. */
  const { data, isLoading } = useCredential(ref);

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /** Ref to access the form's imperative handle (submit method). */
  const formRef = useRef<CreateCredentialFormHandle>(null);

  /**
   * Handler for navigating back to the credentials page.
   * Uses `viewTransition` for smoother transitions.
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/credentials`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to handle credential updates via the API. */
  const { mutate, isPending } = useUpdateCredential();

  /**
   * Handler called after form submission.
   * Updates the credential, shows a toast, and navigates back to the credentials page.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSave = useCallback(
    async ({ name }: Schema) => {
      try {
        mutate({ name, ref });
        toast("Credential updated successfully!");
        onGoBack();
      } catch (error) {
        toast("Oops! Something went wrong while updating the credential.");
      }
    },
    [mutate, ref, onGoBack]
  );

  /**
   * Effect that ensures the user is redirected if the credential does not exist.
   * Shows an error toast and navigates back to the credentials page.
   */
  useEffect(() => {
    if (!isLoading && !data) {
      toast("Oops! You are trying to edit a credential that does not exist.");
      onGoBack();
    }
  }, [isLoading, data, onGoBack]);

  /**
   * Shows a loading indicator while fetching the credential data.
   */
  if (isLoading || !data) {
    return <Splash message="Loading credential details..." />;
  }

  /**
   * Renders the Edit Credential page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Edit Credentials"
        description="Edit a credential to protect your domains, peers, and trunks."
        onBack={{ label: "Back to credentials", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled || isPending}
          >
            {isPending ? "Saving..." : "Save Credential"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateCredentialForm
          ref={formRef}
          onSubmit={onSave}
          initialValues={data}
        />
      </Box>
    </Page>
  );
}
