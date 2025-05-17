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
import { useRef } from "react";
import { WorkspaceSelector } from "./workspace-selector";
import NavItem from "./sidebar-nav-item";
import type { Workspace } from "./sidebar.interfaces";
import { Typography } from "../../design-system/ui/typography/typography";
import { SidebarProvider } from "./sidebar.context";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarNavigation,
  SidebarWrapper
} from "./sidebar.styles";
import { useSidebarItems } from "./sidebar-navigation.const";

const VERSION = "v0.3.4";

export interface SidebarProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  navigate: (href: string) => void;
  pathname: string;
}

const Sidebar = ({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
  navigate,
  pathname
}: SidebarProps) => {
  const { current: year } = useRef(new Date().getFullYear());

  const items = useSidebarItems();

  return (
    <SidebarProvider {...{ navigate, pathname }}>
      <SidebarContainer>
        <SidebarWrapper>
          <SidebarContent>
            <WorkspaceSelector
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              onSelect={onSelectWorkspace}
            />
            <SidebarNavigation>
              {items.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </SidebarNavigation>
          </SidebarContent>
          <SidebarFooter>
            <Typography variant="mono-small">
              &copy; {year}, FONOSTER. {VERSION}
            </Typography>
          </SidebarFooter>
        </SidebarWrapper>
      </SidebarContainer>
    </SidebarProvider>
  );
};

export default Sidebar;
