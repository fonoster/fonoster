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
import { FormControlLabel } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { styled } from "@mui/material/styles";
import type { CheckboxProps as MuiCheckboxProps } from "@mui/material/Checkbox";
import React from "react";

export interface CheckboxProps extends Omit<
  MuiCheckboxProps,
  "color" | "disableRipple"
> {
  children?: React.ReactNode;
}

export const CheckboxLabel = styled(FormControlLabel)(({ theme }) => ({
  "& .MuiFormControlLabel-label": {
    fontFamily: "Poppins",
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontStyle: "normal",
    fontSize: "12px",
    lineHeight: "normal",
    textDecoration: "underline",
    textDecorationStyle: "solid",
    textDecorationSkipInk: "none",
    textDecorationThickness: "auto",
    textUnderlineOffset: "auto",
    textUnderlinePosition: "from-font",
    color: theme.palette.base["03"]
  }
}));

export const CheckboxRoot = styled(Checkbox)(({ theme }) => ({
  padding: "8px",
  color: theme.palette.base["02"],

  "&.Mui-checked": {
    color: theme.palette.base["02"]
  },

  "&.MuiCheckbox-indeterminate": {
    color: theme.palette.base["02"]
  }
}));
