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
import type { Route } from "./+types/settings.page";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useNavigate } from "react-router";
import { useCallback, useMemo, useState } from "react";
import { WorkspaceSettingsForm } from "./settings.form";
import { Box, Stack, Divider as MuiDivider } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { FormProvider } from "~/core/contexts/form-context";
import { FormSubmitButton } from "~/core/components/design-system/ui/form-submit-button/form-submit-button";
import { useAuth } from "~/auth/hooks/use-auth";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { useDeleteWorkspace } from "~/workspaces/services/workspaces.service";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { getErrorMessage } from "~/core/helpers/extract-error-message";
import { Button } from "~/core/components/design-system/ui/button/button";

/**
 * Page metadata function.
 *
 * Sets the page title for SEO and browser tab.
 *
 * @param {Route.MetaArgs} _ - Meta args provided by the route loader.
 * @returns {Array} An array containing the page title.
 */
export function meta(_: Route.MetaArgs) {
  return [{ title: "Workspace Settings | Fonoster" }];
}

/**
 * Overview component (Workspace Settings Page).
 *
 * Renders the workspace settings form, allowing users to modify
 * workspace configuration and save changes. Includes a back navigation
 * button and a dynamic title based on the current workspace.
 *
 * @returns {JSX.Element} The rendered workspace settings page.
 */
export default function Overview() {
  /** Retrieves the current workspace ID from the URL params. */
  const workspaceId = useWorkspaceId();

  /** React Router hook to navigate programmatically. */
  const navigate = useNavigate();

  /** Retrieves the current workspace and user from the authentication context. */
  const { currentWorkspace, user } = useAuth();

  /** State to control the delete workspace dialog visibility. */
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  /** Hook to delete the workspace. */
  const { mutate: deleteWorkspace, isPending: isDeleting } =
    useDeleteWorkspace();

  /**
   * Handler for the "Back to overview" button.
   * Navigates the user to the workspace overview page.
   */
  const onClick = useCallback(() => {
    navigate(`/workspaces/${workspaceId}`, { viewTransition: true });
  }, [navigate, workspaceId]);

  /**
   * Generates the page title dynamically based on the current workspace.
   * Falls back to "Loading..." if workspace data is not yet available.
   */
  const title = useMemo(() => {
    if (!currentWorkspace) return "Loading...";
    return currentWorkspace.name || "Workspace Settings";
  }, [currentWorkspace]);

  /**
   * Determines if the current user is the owner of the workspace.
   * Only the owner can delete the workspace.
   */
  const isOwner = useMemo(() => {
    if (!user || !currentWorkspace) return false;
    return currentWorkspace.ownerRef === user.id;
  }, [user, currentWorkspace]);

  /**
   * Handler for opening the delete workspace dialog.
   */
  const handleOpenDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Handler for closing the delete workspace dialog.
   */
  const handleCloseDeleteDialog = useCallback(() => {
    if (!isDeleting) {
      setIsDeleteDialogOpen(false);
    }
  }, [isDeleting]);

  /**
   * Handler for confirming workspace deletion.
   * Deletes the workspace and redirects to home.
   */
  const handleConfirmDelete = useCallback(() => {
    if (!currentWorkspace) {
      toast(
        "Oops! We are unable to find your workspace :( Please try again later."
      );
      return;
    }

    deleteWorkspace(currentWorkspace.ref, {
      onSuccess: () => {
        toast("Workspace deleted successfully");
        // Redirect to home after successful deletion
        navigate("/", { replace: true });
      },
      onError: (error) => {
        toast(getErrorMessage(error));
      }
    });
  }, [currentWorkspace, deleteWorkspace, navigate]);

  /**
   * Renders the workspace settings page with a header, workspace info, and settings form.
   */
  return (
    <FormProvider>
      <Page variant="form">
        <PageHeader
          title="Workspace Settings"
          onBack={{ label: "Back to overview", onClick }}
          actions={
            <FormSubmitButton size="small" loadingText="Saving...">
              Save Workspace Settings
            </FormSubmitButton>
          }
        />

        <Box sx={{ maxWidth: "440px" }}>
          <Stack
            sx={{
              marginBottom: "24px",
              display: "flex",
              gap: "10px",
              flexDirection: "column"
            }}
          >
            {/* Displays the workspace region (hardcoded as NYC01) */}
            <Typography variant="body-micro" sx={{ color: "base.04" }}>
              NYC01
            </Typography>

            {/* Displays the workspace title */}
            <Typography variant="heading-micro">{title}</Typography>
          </Stack>

          {/* Workspace Settings Form */}
          <WorkspaceSettingsForm />

          {/* Danger Zone Section - Only visible to workspace owner */}
          {isOwner && (
            <Box sx={{ mt: 6 }}>
              <MuiDivider sx={{ mb: 3 }} />

              <Stack spacing={2}>
                <Typography variant="heading-micro">Danger Zone</Typography>

                <Typography variant="body-small" color="base.03">
                  Once you delete a workspace, there is no going back. Please be
                  certain.
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    paddingTop: "12px",
                    alignItems: "center"
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenDeleteDialog}
                    danger
                  >
                    Delete Workspace
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Delete Workspace Confirmation Dialog */}
        <DeleteWorkspaceDialog
          open={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          workspaceName={currentWorkspace?.name}
          isDeleting={isDeleting}
        />
      </Page>
    </FormProvider>
  );
}
