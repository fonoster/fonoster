/*
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
import { IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ReactNode } from "react";
import { ModalRoot, ModalContent, ModalTitle } from "./modal.styles";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  hideCloseButton?: boolean;
}

export const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = "xs",
  hideCloseButton = false
}: ModalProps) => {
  const theme = useTheme();

  return (
    <ModalRoot open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      {title && (
        <ModalTitle>
          {title}
          {!hideCloseButton && (
            <IconButton
              onClick={onClose}
              aria-label="Close modal"
              size="medium"
              sx={{ color: theme.palette.base["02"] }}
            >
              <CloseIcon fontSize="medium" color="inherit" />
            </IconButton>
          )}
        </ModalTitle>
      )}
      <ModalContent sx={{ overflowY: "auto", pt: "6px !important" }}>
        {children}
      </ModalContent>
    </ModalRoot>
  );
};

Modal.displayName = "Modal";
