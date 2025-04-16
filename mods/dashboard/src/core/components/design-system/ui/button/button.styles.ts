import Button from "@mui/material/Button";
import type { ButtonProps, ButtonPropsVariantOverrides } from "@mui/material";
import type { OverridableStringUnion } from "@mui/types";
import { styled } from "@mui/material/styles";

type ButtonVariant = Omit<
  OverridableStringUnion<
    "text" | "outlined" | "contained",
    ButtonPropsVariantOverrides
  >,
  "text"
>;

export interface ButtonAttributes extends ButtonProps, ButtonVariant {}

export const StyledButton = styled(Button)(({ theme, variant, size }) => ({
  display: size === "large" ? "flex" : "inline-flex",
  padding: size === "large" ? "8px 20px" : "6px 20px",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "10px",
  fontFamily: "'Poppins', Roboto Mono",
  fontSize: size === "large" ? "11px" : "10px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "21px",
  letterSpacing: "1.32px",
  textTransform: "uppercase",
  textAlign: "center",
  fontFeatureSettings: "'liga' off, 'clig' off",
  "&:hover": {
    background:
      variant === "outlined"
        ? theme.palette.grey[300]
        : theme.palette.primary.light
  }
}));
