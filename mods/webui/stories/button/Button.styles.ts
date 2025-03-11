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
import Button, { ButtonPropsVariantOverrides } from "@mui/material/Button";
import { Theme, styled } from "@mui/material/styles";
import { ButtonVariant } from "./types";

function computeColor(theme: Theme, variant: ButtonPropsVariantOverrides) {
  if (theme.palette.mode === "dark") {
    return theme.palette.common.white;
  } else if (variant === "outlined") {
    return theme.palette.grey[800];
  } else {
    return theme.palette.primary[900];
  }
}

export const StyledMuiButton = styled(Button)(({ theme, variant, size }) => ({
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
