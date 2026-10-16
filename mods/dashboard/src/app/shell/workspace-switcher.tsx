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
import { Check, ChevronsUpDown, LayoutGrid, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/lib/auth";
import { cn } from "~/lib/utils";
import { workspacePath } from "~/workspaces/workspace-session";
import { useWorkspaces } from "~/workspaces/workspaces.service";

export function workspaceInitials(name: string) {
  const words = name.trim().split(/\s+/);
  return (
    words.length >= 2 ? words[0][0] + words[1][0] : name.slice(0, 2)
  ).toUpperCase();
}

/** The current workspace at the top of the sidebar; opens a menu to switch or create. */
export function WorkspaceSwitcher({
  current,
  collapsed
}: {
  current: Workspace;
  collapsed: boolean;
}) {
  const { user } = useAuth();
  const { data: workspaces = [] } = useWorkspaces();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Workspace: ${current.name}. Switch workspace`}
        className={cn(
          "flex cursor-pointer items-center rounded-control text-sidebar-accent-foreground outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed
            ? "size-10 justify-center bg-sidebar-accent"
            : "h-10 w-full gap-2.5 border border-sidebar-border px-2.5"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[6px] bg-sidebar-accent font-mono font-semibold",
            collapsed ? "text-xs" : "size-6 text-[10px]"
          )}
          aria-hidden
        >
          {workspaceInitials(current.name)}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left font-display text-sm font-medium">
              {current.name}
            </span>
            <ChevronsUpDown
              className="size-3.5 text-sidebar-foreground"
              aria-hidden
            />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={collapsed ? "right" : "bottom"}
        className="w-[280px] rounded-xl p-1.5"
      >
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.ref}
            onSelect={() => navigate(workspacePath(workspace.ref))}
            className={cn(
              "gap-2.5 rounded-lg px-2.5 py-2",
              workspace.ref === current.ref && "bg-accent"
            )}
          >
            <span className="flex size-6 items-center justify-center rounded-[6px] bg-muted font-mono text-[10px] font-semibold">
              {workspaceInitials(workspace.name)}
            </span>
            <span className="flex-1 truncate font-display text-[13px]">
              {workspace.name}
            </span>
            {workspace.ownerRef === user?.sub && (
              <span className="font-display text-[11px] text-muted-foreground">
                Owner
              </span>
            )}
            {workspace.ref === current.ref && (
              <Check aria-label="Current workspace" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="gap-2.5 rounded-lg px-2.5 py-2 font-display text-[13px]"
        >
          <Link to="/workspaces">
            <LayoutGrid /> All workspaces
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="gap-2.5 rounded-lg px-2.5 py-2 font-display text-[13px]"
        >
          <Link to="/workspaces/new">
            <Plus /> New workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
