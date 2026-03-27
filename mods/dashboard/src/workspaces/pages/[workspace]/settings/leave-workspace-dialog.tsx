/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
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
import { Stack, Box } from "@mui/material";
import { useCallback } from "react";

export interface LeaveWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workspaceName?: string;
  isLeaving?: boolean;
}

/**
 * LeaveWorkspaceDialog component
 *
 * Confirms that the current user wants to leave the workspace and lose access
 * until an owner invites them again.
 *
 * @param {LeaveWorkspaceDialogProps} props - Props including open state, handlers, and workspace name.
 * @returns {JSX.Element} The rendered confirmation dialog.
 */
export function LeaveWorkspaceDialog({
  open,
  onClose,
  onConfirm,
  workspaceName,
  isLeaving = false
}: LeaveWorkspaceDialogProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Leave Workspace"
      maxWidth="sm"
      hideCloseButton={isLeaving}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="body-small" color="base.03" sx={{ mb: 2 }}>
            Are you sure you want to leave{" "}
            {workspaceName ? (
              <strong>{workspaceName}</strong>
            ) : (
              "this workspace"
            )}
            ? You will lose access to its resources until a workspace owner
            invites you again.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isLeaving}
            size="small"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLeaving}
            size="small"
            danger
          >
            {isLeaving ? "Leaving..." : "Leave Workspace"}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
