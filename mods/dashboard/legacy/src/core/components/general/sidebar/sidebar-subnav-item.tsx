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
import type { SidebarItem } from "./sidebar.interfaces";
import { useSidebar } from "./sidebar.context";
import {
  SidebarNavItemContent,
  SidebarNavItemRoot,
  SidebarNavItemText
} from "./sidebar.styles";
import { useCallback } from "react";

export interface SubNavItemProps {
  item: SidebarItem;
}

const SubNavItem = ({ item }: SubNavItemProps) => {
  const { navigate, isItemActive } = useSidebar();

  const onNavigate = useCallback(
    () => navigate(item.href),
    [item.href, navigate]
  );

  return (
    <SidebarNavItemRoot
      onClick={onNavigate}
      data-selected={isItemActive(item)}
      sx={{ pl: "16px" }}
    >
      <SidebarNavItemContent data-selected={isItemActive(item)}>
        <SidebarNavItemText
          variant="drawer-label"
          data-selected={isItemActive(item)}
        >
          {item.label}
        </SidebarNavItemText>
      </SidebarNavItemContent>
    </SidebarNavItemRoot>
  );
};

export default SubNavItem;
