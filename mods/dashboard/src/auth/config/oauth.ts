import { BUILD_TIME_CONFIG } from "~/core/config/fonoster.buildtime-config";

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
  provider?: string;
  action: OAuthAction;
}

export interface OAuthState {
  provider: string;
  nonce: string;
  action: OAuthAction;
}

const createOAuthConfig = (scope: string): OAuthConfig => ({
  clientId: BUILD_TIME_CONFIG.GITHUB_OAUTH.clientId,
  redirectUri: "/",
  redirectUriCallback: BUILD_TIME_CONFIG.GITHUB_OAUTH.callbackUrl,
  authUrl: BUILD_TIME_CONFIG.GITHUB_OAUTH.authUrl,
  scope
});

export const OAUTH_CONFIG = Object.freeze({
  signin: createOAuthConfig("read:user"),
  signup: createOAuthConfig("user:email")
});

const createOAuthUrl = (action: OAuthAction): string => {
  const config = OAUTH_CONFIG[action];
  const state: OAuthState = {
    provider: "github",
    nonce: Math.random().toString(36).slice(2),
    action
  };

  const queryParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUriCallback,
    scope: config.scope,
    state: encodeURIComponent(JSON.stringify(state))
  });

  return `${config.authUrl}?${queryParams.toString()}`;
};

export const getGithubSigninUrl = (): string => createOAuthUrl("signin");
export const getGithubSignupUrl = (): string => createOAuthUrl("signup");
