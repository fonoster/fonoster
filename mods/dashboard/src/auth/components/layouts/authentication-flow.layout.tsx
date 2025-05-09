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
import { Box, styled } from "@mui/material";
import { Outlet } from "react-router";
import { AuthenticationFlowHeader as LayoutHeader } from "./authentication-flow.header";

export default function AuthenticationFlowLayout() {
  return (
    <LayoutRoot>
      <LayoutHeader />
      <LayoutContent>
        <Outlet />
      </LayoutContent>
    </LayoutRoot>
  );
}

export const LayoutRoot = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  minHeight: "100vh"
}));

export const LayoutContent = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 40px",
  width: "100%",
  height: "100%",
  flexGrow: 1
}));
