import { WebClient } from "@fonoster/sdk";

/**
 * Extended interface for the Fonoster client
 * Includes additional methods that may not be in the original definition
 */
export interface WebClient {
  setAccessKeyId(accessKeyId: string, token?: string): void;
  getIdToken(): string;
  getAccessToken(): string;
  getRefreshToken(): string;
  setAccessToken(token: string): void;
  setRefreshToken(token: string): void;
  setIdToken(token: string): void;
  verifyCode(params: any): Promise<any>;
  sendVerificationCode(params: any): Promise<any>;
  logout(): Promise<void>;
  login(username: string, password: string): Promise<void>;
  loginWithOauth2Code(provider: string, code: string): Promise<void>;
  loginWithRefreshToken(refreshToken: string | null): Promise<void>;
}

/**
 * Creates a new Fonoster client
 * @param config Client configuration
 * @returns Fonoster client
 */
export function createFonosterClient(config: { url?: string } = {}): WebClient {
  const sdkConfig = {
    endpoint: config.url,
    accessKeyId: "temporary",
    allowInsecure: process.env.NODE_ENV === "development",
    withoutInterceptors: false
  };

  try {
    const client = new WebClient(sdkConfig);

    if (typeof client.setAccessToken === "function") {
      const originalSetAccessToken = client.setAccessToken;
      client.setAccessToken = function (token: string) {
        return originalSetAccessToken.call(this, token);
      };
    }

    if (typeof client.setRefreshToken === "function") {
      const originalSetRefreshToken = client.setRefreshToken;
      client.setRefreshToken = function (token: string) {
        return originalSetRefreshToken.call(this, token);
      };
    }

    if (typeof client.setIdToken === "function") {
      const originalSetIdToken = client.setIdToken;
      client.setIdToken = function (token: string) {
        return originalSetIdToken.call(this, token);
      };
    }

    return client;
  } catch (error) {
    throw error;
  }
}

/**
 * Fonoster SDK configuration
 */
export const SDK_CONFIG = {
  /**
   * Fonoster API URL
   */
  API_URL: process.env.NEXT_PUBLIC_FONOSTER_URL || "",

  /**
   * Access token expiration time in seconds
   */
  ACCESS_TOKEN_EXPIRY: 60 * 60 * 24, // 1 day

  /**
   * Refresh token expiration time in seconds
   */
  REFRESH_TOKEN_EXPIRY: 60 * 60 * 24 * 7, // 7 days

  /**
   * Threshold for refreshing the token in minutes
   */
  REFRESH_THRESHOLD_MINUTES: 5
};
