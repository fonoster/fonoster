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
import { forwardRef, type ReactNode, useCallback, useState } from "react";
import { InputAdornment, IconButton, type TextFieldProps } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { InputRoot } from "./input.styles";
import { Tooltip } from "../tooltip/tooltip";

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
      value,
      ...rest
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(String(value));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }, [value]);

    return (
      <InputRoot
        {...rest}
        ref={ref}
        variant="outlined"
        fullWidth
        helperText={supportingText}
        size={size}
        value={value}
        sx={{ opacity: 0.8 }}
        InputProps={{
          readOnly: true,
          startAdornment: leadingIcon ? (
            <InputAdornment position="start">{leadingIcon}</InputAdornment>
          ) : undefined,
          endAdornment: (
            <InputAdornment position="end" sx={{ right: "16px" }}>
              {trailingIcon}
              <Tooltip title={copied ? "¡Copied!" : "Copy to clipboard"}>
                <IconButton
                  aria-label="Copy to clipboard"
                  onClick={handleCopy}
                  edge="end"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
        slotProps={{
          inputLabel: { shrink: true },
          ...slotProps
        }}
      />
    );
  }
);

Input.displayName = "Input";
