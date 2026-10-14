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
import { forwardRef, useCallback, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Tooltip } from "../tooltip/tooltip";
import { toast } from "../toaster/toaster";

export interface ResourceIdFieldProps {
  /** The resource ID/ref value to display */
  value: string;
  /** Label for the field */
  label?: string;
  /** Whether to show the copy icon (default: true) */
  showCopyIcon?: boolean;
}

/**
 * ResourceIdField component
 *
 * A clean display component for showing resource IDs/refs with built-in copy functionality.
 * Styled to look like the Trunk SID example - simple text with a copy icon.
 */
export const ResourceIdField = forwardRef<HTMLDivElement, ResourceIdFieldProps>(
  ({ value, label = "Resource Ref", showCopyIcon = true, ...rest }, ref) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(String(value));
        setCopied(true);
        toast("Resource Ref copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast("Failed to copy to clipboard", { variant: "error" });
      }
    }, [value]);

    return (
      <Box ref={ref} {...rest} sx={{ pb: "8px" }}>
        {/* Label */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            mb: 0.5,
            fontSize: "16px"
          }}
        >
          {label}
        </Typography>

        {/* Value with copy icon */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontFamily: "monospace",
              fontSize: "14px",
              wordBreak: "break-all"
            }}
          >
            {value}
          </Typography>

          {showCopyIcon && (
            <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
              <IconButton
                aria-label="Copy resource Ref to clipboard"
                onClick={handleCopy}
                size="small"
                sx={{
                  ml: "auto",
                  color: "brand.05",
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "brand.06"
                  }
                }}
              >
                <ContentCopyIcon fontSize="small" color="inherit" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  }
);

ResourceIdField.displayName = "ResourceIdField";
