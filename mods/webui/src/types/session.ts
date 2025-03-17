export interface CustomSession {
  isAuthenticated: boolean;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
}
