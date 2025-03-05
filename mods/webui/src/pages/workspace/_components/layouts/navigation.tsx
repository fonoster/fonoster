import DashboardIcon from "@mui/icons-material/Dashboard";
import AppsIcon from "@mui/icons-material/Apps";
import StorageIcon from "@mui/icons-material/Storage";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SecurityIcon from "@mui/icons-material/Security";
import MonitorIcon from "@mui/icons-material/Monitor";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import CallIcon from "@mui/icons-material/Call";
import PhoneIcon from "@mui/icons-material/Phone";
import DnsIcon from "@mui/icons-material/Dns";
import GroupIcon from "@mui/icons-material/Group";
import GppGoodIcon from "@mui/icons-material/GppGood";
import VpnLockIcon from "@mui/icons-material/VpnLock";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { Navigation, NavigationPageItem } from "@toolpad/core/AppProvider";
import WorkspaceSelector from "@/pages/workspace/_components/WorkspaceSelector";

interface CustomNavigationPageItem extends Partial<NavigationPageItem> {
  component?: React.ComponentType;
  children?: Navigation;
  collapsible?: boolean;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  segment?: string;
  href?: string;
  sx?: any;
}

// Create a custom type for the workspace nav item
interface WorkspaceNavigationItem extends CustomNavigationPageItem {
  kind: "custom";
  title: string;
  icon: React.ReactNode;
  collapsible: boolean;
  sx: {
    width: string;
    minWidth: number;
    padding: number;
    "& .MuiListItemText-root": {
      display: string;
    };
  };
}

// Update the WorkspaceNavItem component
const WorkspaceNavItem = (): CustomNavigationPageItem => {
  return {
    segment: "workspace-selector",
    icon: <WorkspaceSelector />,
    sx: {
      width: "100%",
      "& .MuiListItemButton-root": {
        p: 0
      },
      "& .MuiListItemIcon-root": {
        minWidth: "unset",
        width: "100%"
      }
    }
  };
};

export const NAVIGATION: Navigation = [
  WorkspaceNavItem(),
  {
    kind: "divider"
  },
  {
    kind: "header",
    title: "General"
  },
  {
    segment: "overview",
    title: "Overview",
    icon: <DashboardIcon />,
    href: "/workspace"
  },
  {
    segment: "applications",
    title: "Applications",
    icon: <AppsIcon />,
    href: "/workspace/1/applications",
    badge: "•",
    badgeColor: "success"
  },
  {
    kind: "divider"
  },
  {
    kind: "header",
    title: "Network"
  },
  {
    segment: "sip-network",
    title: "SIP Network",
    icon: <NetworkCheckIcon />,
    href: "/workspace/1/sip-network",
    collapsible: true,
    children: [
      {
        segment: "trunks",
        title: "Trunks",
        icon: <CallIcon />,
        href: "/workspace/1/sip-network/trunks",
        badge: "•",
        badgeColor: "success"
      },
      {
        segment: "numbers",
        title: "Numbers",
        icon: <PhoneIcon />,
        href: "/workspace/1/sip-network/numbers"
      },
      {
        segment: "domains",
        title: "Domains",
        icon: <DnsIcon />,
        href: "/workspace/1/sip-network/domains"
      },
      {
        segment: "agents",
        title: "Agents",
        icon: <GroupIcon />,
        href: "/workspace/1/sip-network/agents"
      },
      {
        segment: "acls",
        title: "ACLs",
        icon: <GppGoodIcon />,
        href: "/workspace/1/sip-network/acls"
      },
      {
        segment: "credentials",
        title: "Credentials",
        icon: <VpnLockIcon />,
        href: "/workspace/1/sip-network/credentials"
      }
    ]
  },
  {
    kind: "divider"
  },
  {
    kind: "header",
    title: "Resources"
  },
  {
    segment: "storage",
    title: "Storage",
    icon: <StorageIcon />,
    href: "/workspace/1/storage"
  },
  {
    segment: "secrets",
    title: "Secrets",
    icon: <SecurityIcon />,
    href: "/workspace/1/secrets"
  },
  {
    segment: "api-keys",
    title: "API Keys",
    icon: <VpnKeyIcon />,
    href: "/workspace/1/api-keys"
  },
  {
    kind: "divider"
  },
  {
    kind: "header",
    title: "System"
  },
  {
    segment: "monitoring",
    title: "Monitoring",
    icon: <MonitorIcon />,
    href: "/workspace/1/monitoring"
  }
] as Navigation;
