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
