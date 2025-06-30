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
import {
  CreateAclForm,
  type CreateAclFormHandle
} from "~/acls/pages/create-acl/create-acl.form";
import { useCreateAcl } from "~/acls/pages/create-acl/create-acl.hook";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import type { Schema } from "~/acls/pages/create-acl/create-acl.schema";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
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
export const CreateDomainAclsModal = ({ isOpen, onClose, onFormSubmit }: DomainAclsModalProps) => {
  const formRef = useRef<CreateAclFormHandle>(null);
  const { onSave, isPending } = useCreateAcl();

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
      const acls = await onSave(data, true);
      if (!acls) {
        toast("Failed to create ACL. Please try again.");
        return;
      }
      if (typeof onFormSubmit === "function") {
        onFormSubmit(acls);
      }
      onClose();
      setTimeout(() => {
        formRef.current?.reset();
      }, 100);
    },
    [onSave, onClose, onFormSubmit]
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create New Access Control List (ACL)"
    >
      <CreateAclForm ref={formRef} onSubmit={onSubmit} />
      <Box
        sx={{
          width: "100%",
          mt: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Button
          isFullWidth
          size="small"
          onClick={() => formRef.current?.submit()}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save ACL"}
        </Button>
      </Box>
    </Modal>
  );
}; 