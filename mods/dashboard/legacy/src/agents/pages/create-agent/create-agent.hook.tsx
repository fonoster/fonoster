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
import { useCreateAgent as useCreate } from "~/agents/services/agents.service";
import type { Schema } from "./create-agent.schema";
import { getErrorMessage } from "~/core/helpers/extract-error-message";

export const useCreateAgent = () => {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /**
   * Handler for navigating back to the workspace agents page.
   * Uses view transitions for smoother page transitions (if supported).
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/agents`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to create a agent via API with optimistic updates. */
  const { mutateAsync, isPending } = useCreate();

  /**
   * Handler called after form submission.
   * Submits the data, shows a toast, and navigates back to the agents page.
   *
   * @param {Schema} data - The validated form data from the form component.
   */
  const onSave = useCallback(
    async (data: Schema) => {
      try {
        await mutateAsync(data);
        toast("Agent created successfully!");
        onGoBack();
      } catch (error) {
        toast(getErrorMessage(error));
      }
    },
    [mutateAsync, onGoBack]
  );

  /**
   * Renders the Create Agent page layout.
   */
  return {
    onGoBack,
    onSave,
    isPending
  };
};
