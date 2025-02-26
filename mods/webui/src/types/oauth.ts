export interface OAuthConfig {
    clientId: string;
    redirectUri: string;
    redirectUriCallback: string;
    scope: string;
    authUrl: string;
}

export interface OAuthResponse {
    code: string;
    provider?: string;
} 