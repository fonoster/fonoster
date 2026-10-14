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
import { Dialog, DialogTitle, DialogContent, alpha } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  hideCloseButton?: boolean;
}

export const ModalRoot = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 0,
    boxShadow: "0px 4px 32px rgba(0, 0, 0, 0.15)",
    margin: "0 auto",
    overflow: "visible",
    maxWidth: "430px"
  },
  "& .MuiBackdrop-root": {
    backgroundColor: alpha(String(theme.palette.brand["02"]), 0.75)
  }
}));

export const ModalTitle = styled(DialogTitle)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  fontWeight: 400,
  color: theme.palette.base["02"],
  fontFeatureSettings: "'liga' off, 'clig' off",
  fontSize: "16px",
  fontStyle: "normal",
  letterSpacing: "0.16px",
  lineHeight: "21px",
  width: "100%"
}));

export const ModalContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3),
  overflow: "visible"
}));
