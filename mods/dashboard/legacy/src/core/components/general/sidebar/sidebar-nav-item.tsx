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
import { useCallback, useEffect, useState } from "react";
import { Collapse } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import type { SidebarItem } from "./sidebar.interfaces";
import SubNavItem from "./sidebar-subnav-item";
import { useSidebar } from "./sidebar.context";
import {
  SidebarNavItemContent,
  SidebarNavItemRoot,
  SidebarNavItemSubMenu,
  SidebarNavItemText
} from "./sidebar.styles";

export interface NavItemProps {
  item: SidebarItem;
}

const NavItem = ({ item }: NavItemProps) => {
  const { href, items: nestedItems } = item;
  const { isForcedOpen, isItemActive, navigate } = useSidebar();

  const [isOpen, setOpen] = useState(false);
  const handleToggle = useCallback(() => setOpen((prev) => !prev), []);

  const onClickEvent = useCallback(() => {
    if (nestedItems) return handleToggle();

    navigate(href);
  }, [href, nestedItems, navigate, handleToggle]);

  useEffect(() => {
    setOpen(isForcedOpen(item));
  }, [isForcedOpen, item]);

  return (
    <>
      <SidebarNavItemRoot
        onClick={onClickEvent}
        data-selected={isItemActive(item)}
      >
        <SidebarNavItemContent data-selected={isItemActive(item)}>
          <SidebarNavItemText
            variant="drawer-label"
            data-selected={isItemActive(item)}
          >
            {item.label}
          </SidebarNavItemText>
          {nestedItems &&
            (isOpen ? (
              <ExpandLess sx={{ color: "base.04" }} />
            ) : (
              <ExpandMore sx={{ color: "base.04" }} />
            ))}
        </SidebarNavItemContent>
      </SidebarNavItemRoot>
      {nestedItems && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <SidebarNavItemSubMenu>
            {nestedItems.map((child) => (
              <SubNavItem key={child.label} item={child} />
            ))}
          </SidebarNavItemSubMenu>
        </Collapse>
      )}
    </>
  );
};

export default NavItem;
