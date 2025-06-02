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
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useNavigate } from "react-router";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useCreateSecret as useCreate } from "~/secrets/services/secrets.service";
import type { Schema } from "./create-secret.schema";

export const useCreateSecret = () => {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /**
   * Handler for navigating back to the workspace secrets page.
   * Uses view transitions for smoother page transitions (if supported).
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/secrets`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to create a secret via API with optimistic updates. */
  const { mutate, isPending } = useCreate();

  /**
   * Handler called after form submission.
   * Submits the data, shows a toast, and navigates back to the secrets page.
   *
   * @param {Schema} data - The validated form data from the form component.
   */
  const onSave = useCallback(
    async (data: Schema) => {
      try {
        mutate({ ...data });
        toast("Secret created successfully!");
        onGoBack();
      } catch (error) {
        toast("Oops! Something went wrong while creating the secret.");
      }
    },
    [mutate, onGoBack]
  );

  /**
   * Renders the Create Secret page layout.
   */
  return {
    onGoBack,
    onSave,
    isPending
  };
};
