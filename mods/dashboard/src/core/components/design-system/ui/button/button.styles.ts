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
import Button from "@mui/material/Button";
import type {
  ButtonProps,
  ButtonPropsVariantOverrides,
  Theme
} from "@mui/material";
import type { OverridableStringUnion } from "@mui/types";
import { styled } from "@mui/material/styles";
import { type CSSObject } from "@mui/system";

type ButtonVariant = Omit<
  OverridableStringUnion<
    "text" | "outlined" | "contained",
    ButtonPropsVariantOverrides
  >,
  "text"
>;

export interface ButtonAttributes {
  children?: React.ReactNode;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  type?: ButtonProps["type"];
  isFullWidth?: boolean;
  onClick?: ButtonProps["onClick"];
}

const sizeStyles = (size: ButtonProps["size"]): CSSObject => {
  if (size === "large") {
    return {
      fontSize: "11px",
      letterSpacing: "1.32px",
      padding: "8px 24px",
      minHeight: "37px",
      maxHeight: "37px"
    };
  }

  return {
    fontSize: "10px",
    letterSpacing: "0.5px",
    padding: "6px 20px",
    minHeight: "33px",
    maxHeight: "33px"
  };
};

const outlinedStyles = (theme: Theme): CSSObject[] => [
  {
    backgroundColor: "transparent",
    color: theme.palette.base["03"],
    borderColor: `${theme.palette.base["03"]}`,
    border: `1px solid ${theme.palette.base["03"]}`
  }
];

const containedStyles = (theme: Theme): CSSObject[] => [
  {
    backgroundColor: theme.palette.brand.main,
    color: theme.palette.brand["07"],
    borderColor: theme.palette.brand.main
  },
  theme.applyStyles("dark", { color: "white" })
];

const variantStyles = (
  variant: ButtonVariant | undefined,
  theme: Theme
): CSSObject[] => {
  if (variant === "outlined") {
    return outlinedStyles(theme);
  }

  return containedStyles(theme);
};

export const StyledButton = styled(Button)<ButtonAttributes>(
  ({ theme, variant, size, disabled }) => [
    {
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
      lineHeight: "normal",
      overflow: "hidden",
      textOverflow: "ellipsis",
      textDecoration: "none",
      ...sizeStyles(size)
    },
    ...variantStyles(variant, theme)
  ]
);
