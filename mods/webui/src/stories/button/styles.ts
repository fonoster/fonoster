import { styled, Theme } from "@mui/material/styles";
import Button, { ButtonPropsVariantOverrides } from "@mui/material/Button";
import { ButtonVariant } from "./types";

function computeColor(theme: Theme, variant: ButtonPropsVariantOverrides) {
  if (theme.palette.mode === "dark") {
    return "#FFFFFF";
  } else if (variant === "outlined") {
    return theme.palette.grey[800];
  } else {
    return theme.palette.text.primary;
  }
}

export const StyledMuiButton = styled(Button)(({ theme, variant, fullWidth }) => ({
  display: "flex",
  padding: fullWidth ? "8px" : "6px 20px",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "10px",
  fontFamily: "Roboto Mono",
  fontSize: fullWidth ? "11px" : "10px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "21px",
  letterSpacing: "1.32px",
  textTransform: "uppercase",
  textAlign: "center",
  fontFeatureSettings: "'liga' off, 'clig' off",
  border:
    variant === "outlined"
      ? `1px solid ${computeColor(theme, variant)}`
      : "none",
  color: computeColor(theme, variant as ButtonVariant),
  "&:hover": {
    background:
      variant === "outlined"
        ? theme.palette.grey[300]
        : theme.palette.primary.light
  }
}));
