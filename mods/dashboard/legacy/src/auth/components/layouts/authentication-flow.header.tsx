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
import { styled } from "@mui/material";
import { memo } from "react";
import { Logo } from "~/core/components/design-system/ui/logo/logo";

export const AuthenticationFlowHeader = memo(() => {
  return (
    <HeaderRoot>
      <Logo />
    </HeaderRoot>
  );
});

export const HeaderRoot = styled("div")(({ theme }) => ({
  minHeight: "75px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 40px",
  width: "100%",
  borderBottom: `1px solid ${theme.palette.base["06"]}`
}));
