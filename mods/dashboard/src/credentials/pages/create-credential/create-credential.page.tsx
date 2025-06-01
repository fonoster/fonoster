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
import type { Route } from "./+types/create-credential.page";
import { useCallback, useRef } from "react";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useNavigate } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateCredentialForm,
  type CreateCredentialFormHandle
} from "./create-credential.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useCreateCredential } from "~/credentials/services/credentials.service";
import type { Schema } from "./create-credential.schema";

/**
 * Page metadata for the "Create Credential" page.
 *
 * Sets the page title and description for SEO and browser tabs.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Credentials | Fonoster" },
    {
      name: "description",
      content:
        "Add a new credential to handle incoming and outgoing calls. Use this section to manage your credentials and control their settings."
    }
  ];
}

/**
 * CreateCredential component.
 *
 * Page component for creating a new voice credential.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for entering credential details.
 *  - Save action to submit the form.
 *
 * @returns {JSX.Element} The rendered Create Credential page.
 */
export default function CreateCredential() {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /** Ref to access the CreateCredentialForm's imperative handle (submit method). */
  const formRef = useRef<CreateCredentialFormHandle>(null);

  /**
   * Handler for navigating back to the workspace credentials page.
   * Uses view transitions for smoother page transitions (if supported).
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/credentials`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to create a credential via API with optimistic updates. */
  const { mutate, isPending } = useCreateCredential();

  /**
   * Handler called after form submission.
   * Submits the data, shows a toast, and navigates back to the credentials page.
   *
   * @param {Schema} data - The validated form data from the form component.
   */
  const onSave = useCallback(
    async (data: Schema) => {
      try {
        if (!data?.password) {
          toast("Please provide a password for the credentials.");
          return;
        }

        mutate({ password: "", ...data });
        toast("Credential created successfully!");
        onGoBack();
      } catch (error) {
        toast("Oops! Something went wrong while creating the credential.");
      }
    },
    [mutate, onGoBack]
  );

  /**
   * Renders the Create Credential page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Create New Credentials"
        description="Create a new credential to protect your Agent or Trunk."
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
        <CreateCredentialForm ref={formRef} onSubmit={onSave} />
      </Box>
    </Page>
  );
}
