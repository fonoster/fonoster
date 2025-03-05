import { AuthProvider } from "@/common/sdk/auth/AuthClient";

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  redirectUriCallback: string;
  scope: string;
  authUrl: string;
}
export type OAuthAction = "signin" | "signup";

export interface OAuthResponse {
  code: string;
  provider?: AuthProvider;
  action: OAuthAction;
}

export interface OAuthState {
  provider: AuthProvider;
  nonce: string;
  action: OAuthAction;
}

export interface OAuthProviderConfig extends OAuthConfig {
  redirectUriCallback: string;
}
