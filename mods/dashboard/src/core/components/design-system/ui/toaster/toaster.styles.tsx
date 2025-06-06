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
import { toast as sonner } from "sonner";
import { IconButton, Stack, Typography, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface ToastProps {
  id: number | string;
  message: string;
  variant?: "error" | "default";
}

export const Toast = ({ id, message, variant }: ToastProps) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{
        width: "100%",
        py: 1,
        px: 2,
        borderRadius: 1,
        color: theme.palette.brand["07"]
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: 12,
          letterSpacing: "0.12px",
          lineHeight: "normal",
          fontWeight: 400
        }}
      >
        {message}
      </Typography>
      <IconButton
        size="small"
        onClick={() => sonner.dismiss(id)}
        aria-label="Close notification"
        color="inherit"
      >
        <CloseIcon fontSize="medium" color="inherit" />
      </IconButton>
    </Stack>
  );
};
