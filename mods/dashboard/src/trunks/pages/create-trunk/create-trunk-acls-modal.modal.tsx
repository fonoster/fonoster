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
import { useCallback } from "react";
import { CreateAclForm } from "~/acls/pages/create-acl/create-acl.form";
import { useCreateAcl } from "~/acls/pages/create-acl/create-acl.hook";
import { FormProvider } from "~/core/contexts/form-context";
import { FormSubmitButton } from "~/core/components/design-system/ui/form-submit-button/form-submit-button";
import { Box } from "@mui/material";
import type { Schema } from "~/acls/pages/create-acl/create-acl.schema";
import type { Acl } from "@fonoster/types";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";

/**
 * Props interface for the CreateTrunkAclsModal component.
 *
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Function to close the modal.
 * @property {(data: Schema) => void} onFormSubmit - Function triggered when the form is successfully submitted.
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit?: (data: Acl) => void;
}

/**
 * CreateTrunkAclsModal component.
 *
 * Renders a modal dialog containing a form to create a new Domain rule.
 * Uses React Hook Form for form state management and Zod for validation.
 *
 * When the form is submitted:
 * - Calls the onFormSubmit callback with the validated data.
 * - Closes the modal and resets the form state.
 *
 * @param {ModalProps} props - The component props controlling visibility and form behavior.
 * @returns {JSX.Element} The rendered modal containing the rule creation form.
 */
export const CreateTrunkAclsModal = ({
  isOpen,
  onClose,
  onFormSubmit
}: ModalProps) => {
  /** Custom hook to create a acl via API with optimistic updates. */
  const { onSave } = useCreateAcl();

  /**
   * Handles the form submission.
   *
   * Calls the parent-provided onFormSubmit function with the validated data,
   * closes the modal, and resets the form after a short delay to avoid visual flicker.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSubmit = useCallback(
    async (data: Schema) => {
      const acls = await onSave(data, true); // Call the save function with the data and disable navigation

      if (!acls) {
        toast("Failed to create acls. Please try again.");
        return; // If no acls were created, do not proceed
      }

      if (typeof onFormSubmit === "function") {
        onFormSubmit(acls);
      }

      onClose(); // Close the modal
    },
    [onFormSubmit, onClose]
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
