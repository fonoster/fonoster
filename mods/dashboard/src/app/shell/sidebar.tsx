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
import type { Workspace } from "@fonoster/types";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Fragment } from "react";
import { Link, NavLink } from "react-router-dom";
import { Logo, LogoMark } from "~/components/brand/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { workspacePath } from "~/workspaces/workspace-session";
import { NAVIGATION, type NavItem } from "./nav";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

function NavEntry({
  item,
  base,
  collapsed
}: {
  item: NavItem;
  base: string;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <NavLink
      to={item.path ? `${base}/${item.path}` : base}
      end={!item.path}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-control font-display text-sm text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed ? "size-10 justify-center" : "gap-3 px-3 py-[7px]",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({
  workspace,
  collapsed,
  canExpand,
  onToggle
}: {
  workspace: Workspace;
  collapsed: boolean;
  /** False on narrow screens, where the sidebar stays a rail. */
  canExpand: boolean;
  onToggle: () => void;
}) {
  const base = workspacePath(workspace.ref);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggle = canExpand && (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <ToggleIcon className="size-[18px]" aria-hidden />
    </button>
  );

  return (
    <aside
      aria-label="Main"
      className={cn(
        "sticky top-0 flex h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          collapsed ? "items-center gap-3 px-3 py-4" : "gap-4 px-5 pb-5 pt-6"
        )}
      >
        {collapsed ? (
          <>
            {toggle}
            <Link to="/workspaces" aria-label="All workspaces" className="py-1">
              <LogoMark />
            </Link>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <Link to="/workspaces" aria-label="All workspaces">
              <Logo className="h-7" />
            </Link>
            {toggle}
          </div>
        )}
        <WorkspaceSwitcher current={workspace} collapsed={collapsed} />
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto",
          collapsed ? "items-center px-3 py-3" : "px-3 py-1"
        )}
      >
        {NAVIGATION.map((section, index) => (
          <Fragment key={section.title ?? index}>
            {section.title &&
              (collapsed ? (
                <span className="my-2 h-px w-6 bg-sidebar-border" aria-hidden />
              ) : (
                <span className="px-3 pb-1.5 pt-[18px] text-[11px] uppercase text-sidebar-foreground">
                  {section.title}
                </span>
              ))}
            {section.items.map((item) => (
              <NavEntry
                key={item.label}
                item={item}
                base={base}
                collapsed={collapsed}
              />
            ))}
          </Fragment>
        ))}
      </nav>

      <div
        className={cn("flex", collapsed ? "justify-center py-3" : "px-3 py-3")}
      >
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
