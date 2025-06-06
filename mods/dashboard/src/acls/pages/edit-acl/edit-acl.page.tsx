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
import type { Route } from "./+types/edit-acl.page";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateAclForm,
  type CreateAclFormHandle
} from "../create-acl/create-acl.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { Splash } from "~/core/components/general/splash/splash";
import { useAcl, useUpdateAcl } from "~/acls/services/acls.service";
import type { Schema } from "../create-acl/create-acl.schema";
import type { Acl } from "@fonoster/types";
import { getErrorMessage } from "~/core/helpers/extract-error-message";

/**
 * Metadata configuration for the "Edit Acl" page.
 *
 * Used by the router to set the page title and description.
 *
 * @param _ - Meta arguments provided by the router (unused in this case).
 * @returns {Array} Metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Edit ACL | Fonoster" },
    {
      name: "description",
      content: "Edit an ACL to protect your domains, peers, and trunks."
    }
  ];
}

/**
 * EditAcl page component.
 *
 * Renders the Edit Acl page with:
 * - A page header and back navigation.
 * - A pre-filled form for editing ACL details.
 * - Data fetching, error handling, and update logic.
 *
 * @returns {JSX.Element} The rendered Edit Acl page.
 */
export default function EditAcl() {
  /** Retrieves the current workspace ID for navigation purposes. */
  const workspaceId = useWorkspaceId();

  /** Extracts the ACL reference (ID) from the URL parameters. */
  const { ref } = useParams();

  /**
   * Ensures the ACL reference is provided.
   *
   * This value should never be null or undefined; otherwise,
   * throw an error to avoid rendering the form without data.
   */
  if (!ref) {
    throw new Error("ACL reference is required.");
  }

  /** Fetches the existing ACL details from the API. */
  const { data, isLoading } = useAcl(ref);

  /** Hook to navigate between pages in the application. */
  const navigate = useNavigate();

  /** Ref to hold the form's imperative handle (submit and validation). */
  const formRef = useRef<CreateAclFormHandle>(null);

  /**
   * Navigates back to the ACLs overview page.
   *
   * Uses the view transition API for smoother page transitions.
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/acls`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Initializes the mutation hook to update the ACL. */
  const { mutateAsync, isPending } = useUpdateAcl();

  /**
   * Handles the form submission event.
   *
   * - Transforms the unified 'rules' field into 'allow' and 'deny' arrays.
   * - Calls the API to update the ACL.
   * - Shows a toast notification on success or error.
   * - Navigates back to the ACLs page on success.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSave = useCallback(
    async ({ rules, ...data }: Schema) => {
      const deny = rules
        .filter((rule) => rule.type === "deny")
        .map(({ name }) => name);

      const allow = rules
        .filter((rule) => rule.type === "allow")
        .map(({ name }) => name);

      try {
        await mutateAsync({ ...data, ref, deny, allow });
        toast("ACL updated successfully!");
        onGoBack();
      } catch (error) {
        toast(getErrorMessage(error));
      }
    },
    [mutateAsync, ref, onGoBack]
  );

  /**
   * Effect that redirects the user back to the ACLs page if the ACL doesn't exist.
   *
   * - Shows an error toast.
   * - Navigates back to the ACLs overview.
   */
  useEffect(() => {
    if (!isLoading && !data) {
      toast("Oops! You are trying to edit an ACL that does not exist.");
      onGoBack();
    }
  }, [isLoading, data, onGoBack]);

  /**
   * Formats the ACL data into the shape expected by the form.
   *
   * - Combines 'allow' and 'deny' lists into a single 'rules' array.
   *
   * @param {Acl & { deny?: string[] }} acl - The ACL data from the API.
   * @returns {Schema} - The formatted form values.
   */
  const formatAclToFormValues = useCallback(
    (acl: Acl & { deny?: string[] }) => ({
      ...acl,
      rules: [
        ...acl.allow.map((name) => ({ type: "allow", name })),
        ...(acl.deny || []).map((name) => ({ type: "deny", name }))
      ] as Schema["rules"]
    }),
    []
  );

  /**
   * Shows a loading indicator while fetching the ACL data.
   */
  if (isLoading || !data) {
    return <Splash message="Loading ACL details..." />;
  }

  /**
   * Renders the Edit ACL page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Edit ACL"
        description="Edit an ACL to protect your domains, peers, and trunks."
        onBack={{ label: "Back to ACLs", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled || isPending}
          >
            {isPending ? "Saving..." : "Save ACL"}
          </Button>
        }
      />

      {/* Form container with a max width for consistent layout and readability */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateAclForm
          ref={formRef}
          onSubmit={onSave}
          initialValues={formatAclToFormValues(data)}
        />
      </Box>
    </Page>
  );
}
