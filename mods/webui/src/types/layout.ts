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