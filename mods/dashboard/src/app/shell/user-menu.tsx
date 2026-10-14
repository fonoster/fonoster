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
import { ChevronDown, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, initials } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/lib/auth";
import { useTheme, type ThemePreference } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { useCurrentUser } from "~/workspaces/workspaces.service";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor }
];

/** The signed-in user at the bottom of the sidebar: theme and sign-out. */
export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentUser();
  const { preference, setPreference } = useTheme();
  const name = profile?.name || user?.email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account: ${name}`}
        className={cn(
          "flex cursor-pointer items-center rounded-control text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed ? "size-10 justify-center" : "w-full gap-2 px-2 py-1.5"
        )}
      >
        {collapsed ? (
          <Avatar>
            <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-display text-sm text-sidebar-accent-foreground">
                {name}
              </span>
              <span className="truncate font-display text-xs text-muted-foreground">
                {user?.email}
              </span>
            </span>
            <ChevronDown
              className="size-5 text-sidebar-foreground"
              aria-hidden
            />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align="start"
        className="w-56"
      >
        <DropdownMenuLabel className="truncate font-display">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onSelect={(event) => {
                event.preventDefault();
                setPreference(value);
              }}
              aria-checked={preference === value}
              role="menuitemradio"
              className={cn(
                "font-display",
                preference === value && "bg-accent"
              )}
            >
              <Icon /> {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut()} className="font-display">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
