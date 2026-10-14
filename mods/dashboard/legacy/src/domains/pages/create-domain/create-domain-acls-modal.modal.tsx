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
import { CreateAclForm } from "~/acls/pages/create-acl/create-acl.form";
import { FormProvider } from "~/core/contexts/form-context";
import { FormSubmitButton } from "~/core/components/design-system/ui/form-submit-button/form-submit-button";
import { Box } from "@mui/material";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { COLLECTION_QUERY_KEY } from "~/acls/services/acls.service";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import type { Schema } from "~/acls/pages/create-acl/create-acl.schema";
import type { Acl } from "@fonoster/types";

/**
 * Props interface for the CreateDomainAclsModal component.
 *
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Function to close the modal.
 * @property {(data: Acl) => void} [onFormSubmit] - Optional callback triggered when the form is successfully submitted.
 */
export interface DomainAclsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit?: (data: Acl) => void;
}

/**
 * CreateDomainAclsModal component.
 *
 * Renders a modal dialog containing a form to create a new ACL.
 * Uses React Hook Form for form state management and Zod for validation.
 *
 * When the form is submitted:
 * - Calls the onFormSubmit callback with the validated data (if provided).
 * - Closes the modal and resets the form state.
 *
 * @param {DomainAclsModalProps} props - The component props controlling visibility and form behavior.
 * @returns {JSX.Element} The rendered modal containing the ACL creation form.
 */
export const CreateDomainAclsModal = ({
  isOpen,
  onClose,
  onFormSubmit
}: DomainAclsModalProps) => {
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
      const deny = data.rules
        .filter((rule) => rule.type === "deny")
        .map(({ name }) => name);

      const allow = data.rules
        .filter((rule) => rule.type === "allow")
        .map(({ name }) => name);

      return await sdk.acls.createAcl({ ...data, deny, allow } as any);
    },
    onSuccess: (acl: any) => {
      // Invalidate the ACLs list to refresh it
      queryClient.invalidateQueries({
        queryKey: [...COLLECTION_QUERY_KEY, workspaceId]
      });
      toast("ACL created successfully!");
    },
    onError: (error) => {
      toast("Failed to create ACL. Please try again.");
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
      const acl = await mutateAsync(data);
      // The acl returned from mutateAsync has the real ref
      if (typeof onFormSubmitRef.current === "function") {
        onFormSubmitRef.current(acl as Acl);
      }
      onCloseRef.current();
    },
    [mutateAsync] // Only depend on mutateAsync, use refs for callbacks
  );

  return (
    <FormProvider>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Create New Access Control List (ACL)"
      >
        <CreateAclForm onSubmit={onSubmit} />
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
            Save ACL
          </FormSubmitButton>
        </Box>
      </Modal>
    </FormProvider>
  );
};
