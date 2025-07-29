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
import { forwardRef, type ReactNode } from "react";
import { InputAdornment, FormHelperText, InputLabel } from "@mui/material";
import { useFormField } from "../../forms";
import {
  TextareaInput,
  TextareaRoot,
  TextareaFormControl
} from "./textarea.styles";

export interface TextareaProps {
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  supportingText?: string;
  size?: "small" | "medium";
  minRows?: number;
  maxRows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      leadingIcon,
      trailingIcon,
      supportingText,
      size = "medium",
      minRows = 3,
      maxRows,
      ...rest
    },
    ref
  ) => {
    const { error } = useFormField();

    return (
      <TextareaFormControl fullWidth error={Boolean(error)}>
        {label && (
          <InputLabel
            shrink
            className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-shrink"
          >
            {label}
          </InputLabel>
        )}

        <TextareaRoot size={size}>
          {leadingIcon && (
            <InputAdornment position="start">{leadingIcon}</InputAdornment>
          )}
          <TextareaInput
            ref={ref}
            minRows={minRows}
            maxRows={maxRows}
            {...rest}
          />
          {trailingIcon && (
            <InputAdornment position="end">{trailingIcon}</InputAdornment>
          )}
        </TextareaRoot>

        <FormHelperText className="MuiFormHelperText-root">
          {error ? error.message : supportingText}
        </FormHelperText>
      </TextareaFormControl>
    );
  }
);

Textarea.displayName = "Textarea";
