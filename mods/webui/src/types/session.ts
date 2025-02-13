import type { Session } from '@toolpad/core/AppProvider'

export interface CustomSession extends Session {
  isAuthenticated: boolean;
  userIdToken?: string;
  accessToken?: string;
  refreshToken?: string;
} 