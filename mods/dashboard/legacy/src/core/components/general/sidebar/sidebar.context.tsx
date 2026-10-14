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
import { createContext, useCallback, useContext } from "react";
import type { SidebarItem } from "./sidebar.interfaces";

export interface SidebarContextProps {
  navigate: (href: string) => void;
  pathname: string;
  isItemActive: (item: SidebarItem) => boolean;
  isForcedOpen: (item: SidebarItem) => boolean;
}

export interface SidebarProviderProps {
  navigate: (href: string) => void;
  pathname: string;
  children: React.ReactNode;
}

export const SidebarContext = createContext<SidebarContextProps | null>(null);

export const SidebarProvider = ({
  children,
  navigate,
  pathname
}: SidebarProviderProps) => {
  const isItemActive = useCallback(
    ({ href, items }: SidebarItem) => {
      if (href === pathname) return true;

      if (items) {
        return items.some((child) => pathname.includes(child.href));
      }

      return false;
    },
    [pathname]
  );

  const isForcedOpen = useCallback(
    ({ items }: SidebarItem) => {
      if (!items) return false;

      const isActive = items.some((child) => pathname.includes(child.href));

      return isActive;
    },
    [pathname]
  );

  return (
    <SidebarContext.Provider
      value={{ isItemActive, isForcedOpen, navigate, pathname }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar() must be used within a <SidebarProvider />");
  }

  return context;
};
