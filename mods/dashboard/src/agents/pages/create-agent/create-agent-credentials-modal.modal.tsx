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
import { Modal } from "~/core/components/design-system/ui/modal/modal";
import { useCallback, useRef } from "react";
import { CreateCredentialForm } from "~/credentials/pages/create-credential/create-credential.form";
import { FormProvider } from "~/core/contexts/form-context";
import { FormSubmitButton } from "~/core/components/design-system/ui/form-submit-button/form-submit-button";
import { Box } from "@mui/material";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { COLLECTION_QUERY_KEY } from "~/credentials/services/credentials.service";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import type { Schema } from "~/credentials/pages/create-credential/create-credential.schema";
import type { Credentials } from "@fonoster/types";

/**
 * Props interface for the CreateAgentCredentialsModal component.
 *
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Function to close the modal.
 * @property {(data: Credentials) => void} onFormSubmit - Function triggered when the form is successfully submitted.
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: (data: Credentials) => void;
}

/**
 * CreateAgentCredentialsModal component.
 *
 * Renders a modal dialog containing a form to create a new credential.
 * Uses React Hook Form for form state management and Zod for validation.
 *
 * When the form is submitted:
 * - Calls the onFormSubmit callback with the validated data.
 * - Closes the modal and resets the form state.
 *
 * @param {ModalProps} props - The component props controlling visibility and form behavior.
 * @returns {JSX.Element} The rendered modal containing the credential creation form.
 */
export const CreateAgentCredentialsModal = ({
  isOpen,
  onClose,
  onFormSubmit
}: ModalProps) => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  // Use refs to stabilize the callbacks and prevent infinite loops
  const onFormSubmitRef = useRef(onFormSubmit);
  const onCloseRef = useRef(onClose);

  // Update refs when props change
  onFormSubmitRef.current = onFormSubmit;
  onCloseRef.current = onClose;

  // Use regular mutation instead of optimistic mutation to get the real ref
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: Schema) => {
      return await sdk.credentials.createCredentials(data);
    },
    onSuccess: (credentials: any) => {
      // Invalidate the credentials list to refresh it
      queryClient.invalidateQueries({
        queryKey: [...COLLECTION_QUERY_KEY, workspaceId]
      });
      toast("Credentials created successfully!");
    },
    onError: (error) => {
      toast("Failed to create credentials. Please try again.");
    }
  });

  /**
   * Handles the form submission.
   *
   * Calls the mutation function and waits for it to complete
   * to get the real ref before calling the callback.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSubmit = useCallback(
    async (data: Schema) => {
      const credentials = await mutateAsync(data);
      // The credentials returned from mutateAsync has the real ref
      if (typeof onFormSubmitRef.current === "function") {
        onFormSubmitRef.current(credentials as Credentials);
      }
      onCloseRef.current();
    },
    [mutateAsync] // Only depend on mutateAsync, use refs for callbacks
  );

  return (
    <FormProvider>
      <Modal open={isOpen} onClose={onClose} title="Create New Credential">
        <CreateCredentialForm onSubmit={onSubmit} />
        <Box
          sx={{
            width: "100%",
            mt: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <FormSubmitButton isFullWidth size="small" loadingText="Saving...">
            Save Credential
          </FormSubmitButton>
        </Box>
      </Modal>
    </FormProvider>
  );
};
