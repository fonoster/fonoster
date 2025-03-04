import { useMemo } from "react";
import type { NavItemConfig } from "@/types/layout";
import { paths } from "../utils/paths";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";

/**
 * Custom hook that returns the navigation configuration.
 * Uses useMemo to memoize the data and prevent unnecessary re-renders.
 *
 * @returns The navigation items configuration
 */
export const useNavConfig = () => {
  const { selectedWorkspace } = useWorkspaceContext();
  const workspaceId = selectedWorkspace?.ref || "1";

  // Memoize the navigation items to prevent unnecessary re-renders
  const navItems = useMemo<NavItemConfig[]>(
    () => [
      {
        key: "home",
        title: "",
        items: [
          {
            key: "overview",
            title: "Overview",
            href: paths.workspaces.overview(workspaceId)
          },
          {
            key: "applications",
            title: "Applications",
            href: paths.workspaces.applications(workspaceId)
          }
        ]
      },
      {
        key: "sip-network:group",
        title: "",
        items: [
          {
            key: "sip-network",
            title: "SIP Network",
            // icon: 'users',
            items: [
              {
                key: "sip-network:trunks",
                title: "Trunks",
                href: paths.workspaces.sipNetwork.trunks(workspaceId)
              },
              {
                key: "sip-network:numbers",
                title: "Numbers",
                href: paths.workspaces.sipNetwork.numbers(workspaceId)
              },
              {
                key: "sip-network:domains",
                title: "Domains",
                href: paths.workspaces.sipNetwork.domains(workspaceId)
              },
              {
                key: "sip-network:agents",
                title: "Agents",
                href: paths.workspaces.sipNetwork.agents(workspaceId)
              },
              {
                key: "sip-network:acls",
                title: "ACLs",
                href: paths.workspaces.sipNetwork.acls(workspaceId)
              },
              {
                key: "sip-network:credentials",
                title: "Credentials",
                href: paths.workspaces.sipNetwork.credentials(workspaceId)
              }
            ]
          }
        ]
      },
      {
        key: "general",
        items: [
          {
            key: "storage",
            title: "Storage",
            href: paths.workspaces.storage(workspaceId)
          },
          {
            key: "secrets",
            title: "Secrets",
            href: paths.workspaces.secrets(workspaceId)
          },
          {
            key: "apiKey",
            title: "API Keys",
            href: paths.workspaces.apiKey(workspaceId)
          },
          {
            key: "monitoring",
            title: "Monitoring",
            href: paths.workspaces.monitoring(workspaceId)
          }
        ]
      }
    ],
    [workspaceId]
  );

  return {
    items: navItems,
    workspaceId
  };
};
