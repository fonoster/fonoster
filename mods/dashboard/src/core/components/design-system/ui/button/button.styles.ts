import Button from "@mui/material/Button";
import type { ButtonProps, ButtonPropsVariantOverrides } from "@mui/material";
import type { OverridableStringUnion } from "@mui/types";
import { styled } from "@mui/material/styles";
import type { CSSObject } from "@mui/system";

type ButtonVariant = Omit<
  OverridableStringUnion<
    "text" | "outlined" | "contained",
    ButtonPropsVariantOverrides
  >,
  "text"
>;

export interface ButtonAttributes extends ButtonProps, ButtonVariant {}

const sizeStyles = (size: ButtonProps["size"]): CSSObject => {
  switch (size) {
    case "large":
      return {
        fontSize: "11px",
        letterSpacing: "1.32px",
        padding: "8px 20px"
      };
    case "small":
      return {
        fontSize: "9px",
        letterSpacing: "0.4px",
        padding: "4px 16px"
      };
    case "medium":
    default:
      return {
        fontSize: "10px",
        letterSpacing: "0.5px",
        padding: "6px 20px"
      };
  }
};

const variantStyles = (
  variant: ButtonVariant | undefined,
  theme: any
): CSSObject => {
  const isOutlined = variant === "outlined";

  return {
    backgroundColor: isOutlined ? "transparent" : theme.palette.brand.main,
    color: isOutlined ? theme.palette.brand["07"] : theme.palette.base["03"],
    border: isOutlined ? `1px solid ${theme.palette.brand["07"]}` : "none",
    "&:hover": {
      backgroundColor: isOutlined
        ? theme.palette.grey[300]
        : theme.palette.primary.light
    }
  };
};

const darkModeStyles = (
  variant: ButtonVariant | undefined,
  theme: any
): CSSObject =>
  theme.applyStyles("dark", {
    backgroundColor: variant === "outlined" ? theme.palette.grey[700] : "#000",
    color: variant === "outlined" ? theme.palette.grey[300] : "#fff",
    "&:hover": {
      backgroundColor:
        variant === "outlined"
          ? theme.palette.grey[600]
          : theme.palette.primary.dark
    }
  });

export const StyledButton = styled(Button)<ButtonAttributes>(
  ({ theme, variant, size = "large", disabled }) => ({
    /**
     * Generics, overrides and custom styles
     * @see https://mui.com/material-ui/react-button/#customization
     */
    boxShadow: "none",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    appearance: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: "100px",
    whiteSpace: "nowrap",
    fontFamily: "'Roboto Mono', sans-serif",
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontStyle: "normal",
    fontWeight: 500,
    textTransform: "uppercase",
    userSelect: "none",
    transition: "all 0.2s ease-in-out",
    lineHeight: "21px",

    ...sizeStyles(size),
    ...variantStyles(variant, theme),
    ...darkModeStyles(variant, theme)
  })
);
