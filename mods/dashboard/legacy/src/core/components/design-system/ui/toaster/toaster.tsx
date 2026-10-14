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
import Portal from "@mui/material/Portal";
import { Toaster as Sonner, toast as sonner } from "sonner";
import { memo } from "react";
import { Toast } from "./toaster.styles";
import { useTheme } from "@mui/material";

export interface ToastOptions {
  duration?: number;
  variant?: "error" | "default";
}

export const Toaster = memo(() => {
  const theme = useTheme();

  return (
    <Portal>
      <Sonner
        position="top-center"
        toastOptions={{
          className: "mui-toast",
          style: {
            boxShadow:
              "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)",
            padding: 0,
            border: "none",
            borderRadius: "4px",
            backgroundColor: theme.palette.brand["03"]
          }
        }}
      />
    </Portal>
  );
});

export const toast = (
  message: string,
  { duration = 3000, variant = "default" }: ToastOptions = {}
) => {
  const id = `toast__${Date.now().toString()}-${Math.random().toString()}`;

  sonner(<Toast {...{ message, id, variant }} />, { id, duration });
};

Toaster.displayName = "Toaster";
