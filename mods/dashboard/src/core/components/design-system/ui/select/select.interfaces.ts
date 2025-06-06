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
import { type ReactNode } from "react";
import {
  type SelectProps as MUISelectProps,
  type FormControlProps
} from "@mui/material";

export interface SelectOption {
  value: string | number;
  label: string;
}

export type SelectProps = MUISelectProps & {
  label?: string;
  supportingText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  options: SelectOption[];
  onChange?: (event: {
    target: { value: string | number | Array<string | number> };
  }) => void;
};

export type SelectContainerProps = FormControlProps & {
  label?: string;
  supportingText?: string;
  error?: boolean;
  children: ReactNode;
};

export type SelectInputProps = MUISelectProps & {
  options: SelectOption[];
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export interface MultiValueRendererProps {
  selected: Array<string | number>;
  options: SelectOption[];
  onDelete: (val: string | number) => void;
}
