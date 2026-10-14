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
import { Link, useMatch, useResolvedPath } from "react-router-dom";
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

// Measurements from designs/fonoster.lib.pen: "Dashboard/App shell" (248px) and
// "Sidebar/Collapsed" (64px).

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
  const to = item.path ? `${base}/${item.path}` : base;
  // Computed here rather than with NavLink's className function: the tooltip
  // trigger (Radix Slot) merges class names as strings.
  const active = Boolean(
    useMatch({ path: useResolvedPath(to).pathname, end: !item.path })
  );
  const link = (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "flex shrink-0 items-center rounded-control font-display text-sm text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed ? "size-10 justify-center" : "h-[35px] gap-3 px-3",
        active && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
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
      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-sidebar-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <ToggleIcon className="size-[18px]" strokeWidth={1.5} aria-hidden />
    </button>
  );

  return (
    <aside
      aria-label="Main"
      className={cn(
        "sticky top-0 flex h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-[248px]"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 flex-col border-b border-sidebar-border",
          collapsed ? "items-center gap-3 py-4" : "gap-4 px-5 pb-5 pt-6"
        )}
      >
        {collapsed ? (
          <>
            {toggle}
            <Link
              to="/workspaces"
              aria-label="All workspaces"
              className="rounded-[6px]"
            >
              <LogoMark className="size-6" />
            </Link>
          </>
        ) : (
          <div className="flex h-8 items-center justify-between">
            <Link to="/workspaces" aria-label="All workspaces">
              <Logo className="h-8" />
            </Link>
            {toggle}
          </div>
        )}
        <WorkspaceSwitcher current={workspace} collapsed={collapsed} />
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto",
          collapsed ? "items-center py-3" : "mt-6 px-3 py-1"
        )}
      >
        {NAVIGATION.map((section, index) => (
          <Fragment key={section.title ?? index}>
            {section.title &&
              (collapsed ? (
                <span
                  className="flex h-[17px] w-10 shrink-0 items-center justify-center"
                  aria-hidden
                >
                  <span className="h-px w-6 bg-sidebar-border" />
                </span>
              ) : (
                <span className="px-3 pb-1.5 pt-[18px] font-mono text-[11px] uppercase tracking-[0.12em] text-sidebar-foreground">
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
        className={cn(
          "flex shrink-0",
          collapsed
            ? "justify-center border-t border-sidebar-border py-4"
            : "px-3 py-4"
        )}
      >
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
