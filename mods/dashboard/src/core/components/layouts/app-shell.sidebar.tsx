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
import { useLocation, useNavigate } from "react-router";
import Sidebar from "../general/sidebar/sidebar";
import { styled } from "@mui/material";
import { useCallback, useState } from "react";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";

export function AppShellSidebar() {
  const workspaceId = useWorkspaceId();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onNavigate = useCallback(
    (to: string) => navigate(to, { viewTransition: true }),
    [navigate]
  );

  return (
    <AppShellAside>
      <Sidebar
        workspaces={[]}
        pathname={pathname}
        navigate={onNavigate}
        selectedWorkspaceId={selectedWorkspaceId}
        onSelectWorkspace={setSelectedWorkspaceId}
      />
    </AppShellAside>
  );
}

export const AppShellAside = styled("aside")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "250px",
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.base["06"]}`,
  height: "100%",
  overflow: "auto"
}));
