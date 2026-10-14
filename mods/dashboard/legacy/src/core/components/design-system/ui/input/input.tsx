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
import { InputAdornment, type TextFieldProps } from "@mui/material";
import { InputRoot } from "./input.styles";
import { useFormField } from "../../forms";

export interface InputTextProps extends Omit<TextFieldProps, "size"> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  supportingText?: string;
  size?: "small" | "medium";
}

export const Input = forwardRef<HTMLInputElement, InputTextProps>(
  (
    {
      leadingIcon,
      trailingIcon,
      supportingText,
      size = "medium",
      slotProps,
      ...rest
    },
    ref
  ) => {
    const { error } = useFormField();

    return (
      <InputRoot
        {...rest}
        error={Boolean(error)}
        ref={ref}
        variant="outlined"
        fullWidth
        helperText={error ? error.message : supportingText}
        size={size}
        slotProps={{
          input: {
            startAdornment: leadingIcon ? (
              <InputAdornment position="start">{leadingIcon}</InputAdornment>
            ) : undefined,
            endAdornment: trailingIcon ? (
              <InputAdornment position="end">{trailingIcon}</InputAdornment>
            ) : undefined
          },
          inputLabel: {
            shrink: true
          },
          ...slotProps
        }}
      />
    );
  }
);

Input.displayName = "Input";
