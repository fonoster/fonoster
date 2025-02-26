import type { NavItemConfig } from '@/types/layout';
import { paths } from './paths';

// NOTE: We did not use React Components for Icons, because
//  you may one to get the config from the server.

// NOTE: First level elements are groups.

export interface LayoutConfig {
  navItems: NavItemConfig[];
}

export const layoutConfig = {
  navItems: [
    {
      key: 'home',
      title: '',
      items: [
        { key: 'overview', title: 'Overview', href: paths.workspaces.overview('1') },
        { key: 'applications', title: 'Applications', href: paths.workspaces.applications('1') },
      ]
    },
    {
      key: 'sip-network:group',
      title: '',
      items: [
        {
          key: 'sip-network',
          title: 'SIP Network',
          // icon: 'users',
          items: [
            { key: 'sip-network:trunks', title: 'Trunks', href: paths.workspaces.sipNetwork.trunks('1') },
            { key: 'sip-network:numbers', title: 'Numbers', href: paths.workspaces.sipNetwork.numbers('1') },
            { key: 'sip-network:domains', title: 'Domains', href: paths.workspaces.sipNetwork.domains('1') },
            { key: 'sip-network:agents', title: 'Agents', href: paths.workspaces.sipNetwork.agents('1') },
            { key: 'sip-network:acls', title: 'ACLs', href: paths.workspaces.sipNetwork.acls('1') },
            { key: 'sip-network:credentials', title: 'Credentials', href: paths.workspaces.sipNetwork.credentials('1') },
          ],
        },
      ]
    },
    {
      key: 'general',
      items: [
        {
          key: 'storage',
          title: 'Storage',
          href: paths.workspaces.storage('1'),
        },
        {
          key: 'secrets',
          title: 'Secrets',
          href: paths.workspaces.secrets('1'),
        },
        {
          key: 'apiKey',
          title: 'API Keys',
          href: paths.workspaces.apiKey('1'),
        },
        {
          key: 'monitoring',
          title: 'Monitoring',
          href: paths.workspaces.monitoring('1'),
        }
      ]
    }
  ],
} satisfies LayoutConfig;
