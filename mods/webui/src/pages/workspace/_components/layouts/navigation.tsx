import DashboardIcon from '@mui/icons-material/Dashboard';
import AppsIcon from '@mui/icons-material/Apps';
import StorageIcon from '@mui/icons-material/Storage';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SecurityIcon from '@mui/icons-material/Security';
import MonitorIcon from '@mui/icons-material/Monitor';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import CallIcon from '@mui/icons-material/Call';
import PhoneIcon from '@mui/icons-material/Phone';
import DnsIcon from '@mui/icons-material/Dns';
import GroupIcon from '@mui/icons-material/Group';
import GppGoodIcon from '@mui/icons-material/GppGood';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import { Navigation, NavigationPageItem } from '@toolpad/core/AppProvider';
import WorkspaceSelector from '@/pages/workspace/_components/WorkspaceSelector';
import BusinessIcon from '@mui/icons-material/Business';

interface CustomNavigationPageItem extends NavigationPageItem {
  component?: React.ComponentType;
  children?: Navigation;
  collapsible?: boolean;
  badge?: string;
  badgeColor?: string;
}

export const NAVIGATION: Navigation = [
  {
    kind: 'page',
    segment: 'selector',
    title: 'Workspace',
    icon: <BusinessIcon />,
    component: WorkspaceSelector
  } as CustomNavigationPageItem,

  {
    kind: 'header',
    title: 'General',
  },
  {
    segment: 'overview',
    title: 'Overview',
    icon: <DashboardIcon />,
    href: '/workspace/overview'
  },
  {
    segment: 'applications',
    title: 'Applications',
    icon: <AppsIcon />,
    href: '/workspace/1/applications',
    badge: '•',
    badgeColor: 'success',
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'Network',
  },
  {
    segment: 'sip-network',
    title: 'SIP Network',
    icon: <NetworkCheckIcon />,
    href: '/workspace/1/sip-network',
    collapsible: true,
    children: [
      {
        segment: 'trunks',
        title: 'Trunks',
        icon: <CallIcon />,
        href: '/workspace/1/sip-network/trunks',
        badge: '•',
        badgeColor: 'success',
      },
      {
        segment: 'numbers',
        title: 'Numbers',
        icon: <PhoneIcon />,
        href: '/workspace/1/sip-network/numbers'
      },
      {
        segment: 'domains',
        title: 'Domains',
        icon: <DnsIcon />,
        href: '/workspace/1/sip-network/domains'
      },
      {
        segment: 'agents',
        title: 'Agents',
        icon: <GroupIcon />,
        href: '/workspace/1/sip-network/agents'
      },
      {
        segment: 'acls',
        title: 'ACLs',
        icon: <GppGoodIcon />,
        href: '/workspace/1/sip-network/acls'
      },
      {
        segment: 'credentials',
        title: 'Credentials',
        icon: <VpnLockIcon />,
        href: '/workspace/1/sip-network/credentials'
      },
    ],
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'Resources',
  },
  {
    segment: 'storage',
    title: 'Storage',
    icon: <StorageIcon />,
    href: '/workspace/1/storage'
  },
  {
    segment: 'secrets',
    title: 'Secrets',
    icon: <SecurityIcon />,
    href: '/workspace/1/secrets'
  },
  {
    segment: 'api-keys',
    title: 'API Keys',
    icon: <VpnKeyIcon />,
    href: '/workspace/1/api-keys'
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'System',
  },
  {
    segment: 'monitoring',
    title: 'Monitoring',
    icon: <MonitorIcon />,
    href: '/workspace/1/monitoring'
  },
] as Navigation; 