import { ButtonPropsVariantOverrides } from "@mui/material";

type ButtonVariant = "contained" | "outlined"

type ButtonProps = {
  variant?: ButtonPropsVariantOverrides;
  fullWidth?: boolean;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
};

export type { ButtonProps, ButtonVariant };