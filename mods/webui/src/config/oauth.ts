import { OAuthConfig } from "@/types/oauth";

const BASE_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
  redirectUriCallback:
    process.env.NEXT_PUBLIC_FRONTEND_URL! +
    process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI!,
  authUrl: process.env.NEXT_PUBLIC_GITHUB_URL!
};

export const OAUTH_CONFIG = {
  signin: {
    ...BASE_OAUTH_CONFIG,
    redirectUri: process.env.NEXT_PUBLIC_GITHUB_SIGNIN_REDIRECT_URI!,
    scope: process.env.NEXT_PUBLIC_GITHUB_SIGNIN_SCOPE!
  } as OAuthConfig,

  signup: {
    ...BASE_OAUTH_CONFIG,
    redirectUri: process.env.NEXT_PUBLIC_GITHUB_SIGNUP_REDIRECT_URI!,
    scope: process.env.NEXT_PUBLIC_GITHUB_SIGNUP_SCOPE!
  } as OAuthConfig
};
