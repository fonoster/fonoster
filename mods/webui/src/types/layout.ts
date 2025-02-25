import { CustomSession } from './session'

export interface Authentication {
  signIn: (credentials: { username: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface BaseLayoutProps {
  children: React.ReactNode;
  session: CustomSession;
  authentication: Authentication;
} 

export interface NavItemConfig {
  key: string;
  title?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: string;
  href?: string;
  items?: NavItemConfig[];
  // Matcher cannot be a function in order
  // to be able to use it on the server.
  // If you need to match multiple paths,
  // can extend it to accept multiple matchers.
  matcher?: { type: 'startsWith' | 'equals'; href: string };
}

export type NavColor = 'blend_in' | 'discrete' | 'evident';

export type ColorScheme = 'dark' | 'light';

