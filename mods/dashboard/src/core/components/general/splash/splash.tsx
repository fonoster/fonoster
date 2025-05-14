/**
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
import { Box, styled } from "@mui/material";
import { memo } from "react";
import { Logo } from "../../design-system/ui/logo/logo";

export const Splash = memo(() => {
  return (
    <SplashRoot>
      <Logo />
    </SplashRoot>
  );
});

export const SplashRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100dvh",
  backgroundColor: theme.palette.background.default,

  "& > svg": {
    animation: "fade-in 1.3s ease-in-out infinite alternate",
    "@keyframes fade-in": {
      "0%": {
        opacity: 0.5
      },
      "50%": {
        opacity: 1
      },
      "100%": {
        opacity: 0.5
      }
    }
  }
}));
