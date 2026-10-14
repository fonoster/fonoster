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
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import type { SidebarItem } from "./sidebar.interfaces";
import { useMemo } from "react";

export const SIDEBAR_ITEMS = Object.freeze<SidebarItem[]>([
  { label: "Overview", href: "/workspaces/[workspaceId]" },
  { label: "Applications", href: "/workspaces/[workspaceId]/applications" },
  {
    label: "SIP Network",
    href: "",
    items: [
      {
        label: "Trunks",
        href: "/workspaces/[workspaceId]/sip-network/trunks"
      },
      {
        label: "Numbers",
        href: "/workspaces/[workspaceId]/sip-network/numbers"
      },
      {
        label: "Domains",
        href: "/workspaces/[workspaceId]/sip-network/domains"
      },
      {
        label: "Agents",
        href: "/workspaces/[workspaceId]/sip-network/agents"
      },
      {
        label: "ACLs",
        href: "/workspaces/[workspaceId]/sip-network/acls"
      },
      {
        label: "Credentials",
        href: "/workspaces/[workspaceId]/sip-network/credentials"
      }
    ]
  },
  // { label: "Storage", href: "/workspaces/[workspaceId]/storage" },
  { label: "Secrets", href: "/workspaces/[workspaceId]/secrets" },
  { label: "API Keys", href: "/workspaces/[workspaceId]/api-keys" },
  { label: "Monitoring", href: "/workspaces/[workspaceId]/monitoring" }
]);

export const withWorkspaceId = (url: string, workspaceId: string) => {
  return url.replace(/\[workspaceId\]/g, workspaceId);
};

export const useSidebarItems = () => {
  const workspaceId = useWorkspaceId();

  return useMemo(
    () =>
      SIDEBAR_ITEMS.map((item) => {
        if (item.items) {
          return {
            ...item,
            items: item.items.map((subItem) => ({
              ...subItem,
              href: withWorkspaceId(subItem.href, workspaceId)
            }))
          };
        }

        return { ...item, href: withWorkspaceId(item.href, workspaceId) };
      }),
    [workspaceId]
  );
};
