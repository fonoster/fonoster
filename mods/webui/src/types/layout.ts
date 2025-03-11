import { CustomSession } from "./session";

export interface Authentication {
  signIn: (credentials: {
    username: string;
    password: string;
  }) => Promise<void>;
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
  matcher?: { type: "startsWith" | "equals"; href: string };
}

export type NavColor = "blend_in" | "discrete" | "evident";

export type ColorScheme = "dark" | "light";
