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
import type { Route } from "./+types/edit-domain.page";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateDomainForm,
  type CreateDomainFormHandle
} from "../create-domain/create-domain.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { Splash } from "~/core/components/general/splash/splash";
import { useDomain, useUpdateDomain } from "~/domains/services/domains.service";
import type { Schema } from "../create-domain/create-domain.schema";

/**
 * Sets the metadata for the "Edit Domain" page.
 *
 * This information is used by the router to define the page title and description
 * for SEO and display in the browser.
 *
 * @param _ - Meta arguments provided by the router (unused here).
 * @returns {Array} Metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Domains | Fonoster" },
    {
      name: "description",
      content: "Edit a domain to protect your domains, peers, and trunks."
    }
  ];
}

/**
 * EditDomain page component.
 *
 * Renders a page to edit an existing voice domain, including:
 * - Page header with back navigation and save button.
 * - A form pre-filled with the domain details.
 * - Data fetching and optimistic update integration.
 *
 * @returns {JSX.Element} The rendered Edit Domain page.
 */
export default function EditDomain() {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Extracts the domain reference from the URL parameters. */
  const { ref } = useParams();

  /**
   * Ensures the domain reference is provided.
   *
   * This value should never be null or undefined, as it is required
   * to fetch and update the domain data.
   */
  if (!ref) {
    throw new Error("Domain reference is required");
  }

  /** Fetches the existing domain details for editing. */
  const { data, isLoading } = useDomain(ref);

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /** Ref to access the form's imperative handle (submit method). */
  const formRef = useRef<CreateDomainFormHandle>(null);

  /**
   * Handler for navigating back to the domains page.
   * Uses `viewTransition` for smoother transitions.
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/domains`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to handle domain updates via the API. */
  const { mutateAsync, isPending } = useUpdateDomain();

  /**
   * Handler called after form submission.
   * Updates the domain, shows a toast, and navigates back to the domains page.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSave = useCallback(
    async (data: Schema) => {
      try {
        await mutateAsync({ ...data, ref });
        toast("Domain updated successfully!");
        onGoBack();
      } catch (error) {
        toast("Oops! Something went wrong while updating the domain.");
      }
    },
    [mutateAsync, ref, onGoBack]
  );

  /**
   * Effect that ensures the user is redirected if the domain does not exist.
   * Shows an error toast and navigates back to the domains page.
   */
  useEffect(() => {
    if (!isLoading && !data) {
      toast("Oops! You are trying to edit a domain that does not exist.");
      onGoBack();
    }
  }, [isLoading, data, onGoBack]);

  /**
   * Shows a loading indicator while fetching the domain data.
   */
  if (isLoading || !data) {
    return <Splash message="Loading domain details..." />;
  }

  /**
   * Renders the Edit Domain page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Edit Domain"
        description="Edit domain to manage your internal communications. A SIP Domain will group several SIP Agents (e.g. office, home, etc.)"
        onBack={{ label: "Back to domains", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled || isPending}
          >
            {isPending ? "Saving..." : "Save Domain"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateDomainForm
          ref={formRef}
          onSubmit={onSave}
          initialValues={data}
        />
      </Box>
    </Page>
  );
}
