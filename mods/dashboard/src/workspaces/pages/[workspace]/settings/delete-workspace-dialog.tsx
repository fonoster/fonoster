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
import { Button } from "~/core/components/design-system/ui/button/button";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Input } from "~/core/components/design-system/ui/input/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Stack, Box } from "@mui/material";
import { useCallback, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";

export interface DeleteWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workspaceName?: string;
  isDeleting?: boolean;
}

/**
 * DeleteWorkspaceDialog component
 *
 * Displays a confirmation dialog warning the user about the permanent deletion
 * of the workspace and all its data.
 *
 * @param {DeleteWorkspaceDialogProps} props - Props including open state, handlers, and workspace name.
 * @returns {JSX.Element} The rendered confirmation dialog.
 */
export function DeleteWorkspaceDialog({
  open,
  onClose,
  onConfirm,
  workspaceName,
  isDeleting = false
}: DeleteWorkspaceDialogProps) {
  /** Form to handle the confirmation input */
  const form = useForm<{ confirmation: string }>({
    defaultValues: {
      confirmation: ""
    },
    mode: "onChange"
  });

  /** Watch the confirmation field value */
  const confirmationValue = form.watch("confirmation");

  /** Reset form when dialog opens/closes */
  useEffect(() => {
    if (!open) {
      form.reset({ confirmation: "" });
    }
  }, [open, form]);

  /** Check if the confirmation text matches "DELETE" exactly */
  const isConfirmationValid = useMemo(() => {
    return confirmationValue.trim().toUpperCase() === "DELETE";
  }, [confirmationValue]);

  const handleConfirm = useCallback(() => {
    if (isConfirmationValid) {
      onConfirm();
    }
  }, [onConfirm, isConfirmationValid]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Workspace"
      maxWidth="sm"
      hideCloseButton={isDeleting}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="body-small" color="base.03" sx={{ mb: 2 }}>
            Are you sure you want to delete{" "}
            {workspaceName ? (
              <strong>{workspaceName}</strong>
            ) : (
              "this workspace"
            )}
            ? This action cannot be undone.
          </Typography>

          <Typography variant="body-small">
            <strong>Warning:</strong> Deleting this workspace will permanently
            remove all associated data, including:
          </Typography>

          <Box component="ul" sx={{ mt: 2, pl: 2, mb: 0 }}>
            <Typography variant="body-small" color="base.03" sx={{ mb: 0.5 }}>
              - All applications and configurations
            </Typography>
            <Typography variant="body-small" color="base.03" sx={{ mb: 0.5 }}>
              - All API keys and credentials
            </Typography>
            <Typography variant="body-small" color="base.03">
              - All call history and analytics
            </Typography>
          </Box>
        </Box>

        {/* Confirmation input */}
        <Box>
          <Typography variant="body-small" color="base.03" sx={{ mb: 1.5 }}>
            To confirm, type <strong>DELETE</strong> below:
          </Typography>
          <Form {...form}>
            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="DELETE"
                      disabled={isDeleting}
                      size="small"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isDeleting}
            size="small"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting || !isConfirmationValid}
            size="small"
            danger
          >
            {isDeleting ? "Deleting..." : "Delete Workspace"}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
