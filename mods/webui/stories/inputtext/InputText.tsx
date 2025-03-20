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
import React from "react";
import { InputTextProps } from "./types";
import { InputAdornment } from "@mui/material";
import { StyledTextField } from "./InputText.styles";

export const InputText: React.FC<InputTextProps> = ({
  onClick,
  disabled,
  label,
  leadingIcon,
  trailingIcon,
  defaultValue,
  supportingText,
  value,
  onChange,
  error,
  type,
  inputRef,
  name,
  shrink,
  size = "small",
  ...rest
}) => {
  return (
    <StyledTextField
      {...rest}
      name={name}
      inputRef={inputRef}
      variant="outlined"
      fullWidth
      onClick={onClick}
      disabled={disabled}
      label={label}
      helperText={supportingText}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      error={error}
      type={type}
      InputProps={{
        startAdornment: leadingIcon && (
          <InputAdornment position="start">{leadingIcon}</InputAdornment>
        ),
        endAdornment: trailingIcon && (
          <InputAdornment position="end">{trailingIcon}</InputAdornment>
        )
      }}
      slotProps={{
        inputLabel: {
          shrink: shrink,
        },
      }}
    />
  );
};
