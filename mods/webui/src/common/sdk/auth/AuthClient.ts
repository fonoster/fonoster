import { WebClient } from "@/common/sdk/config/sdkConfig";
import { cookieUtils, AUTH_COOKIES } from "@/common/utils/cookieUtils";
import { tokenUtils } from "@/common/utils/tokenUtils";

export enum AuthProvider {
  CREDENTIALS = "credentials",
  GOOGLE = "google",
  GITHUB = "github",
  OTHER = "other"
}

export interface SignInCredentials {
  username: string;
  password: string;
}

export interface SignInOptions {
  credentials?: SignInCredentials;
  provider: AuthProvider;
  oauthCode?: string;
}

/**
 * Authentication client that handles user session and interaction with the Fonoster SDK
 */
export class AuthClient {
  constructor(
    private client: WebClient,
    private setSession: (session: { isAuthenticated: boolean }) => void,
    private onSignOut: () => void
  ) {}

  // ==================== PUBLIC METHODS ====================

  /**
   * Checks if there are valid tokens in cookies
   * @returns true if there are valid tokens, false otherwise
   */
  public checkAuthTokens(): boolean {
    return cookieUtils.hasValidAuthTokens();
  }

  /**
   * Initializes the client with tokens stored in cookies
   * @returns true if initialized successfully, false otherwise
   */
  public initializeWithStoredTokens(): boolean {
    if (!this.checkAuthTokens()) {
      return false;
    }

    const tokens = cookieUtils.getAuthTokens();
    if (!tokens) {
      return false;
    }

    try {
      this.setTokensOnClient(
        tokens.accessToken,
        tokens.refreshToken as string | undefined,
        tokens.idToken as string | undefined
      );

      this.setSession({ isAuthenticated: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Signs in with the provided credentials
   * @param options Sign in options
   */
  public async signIn(options: SignInOptions): Promise<void> {
    if (!this.client) throw new Error("Client is not initialized");

    try {
      await this.authenticateWithProvider(options);
      this.saveTokensAndUpdateSession();
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  /**
   * Registers a new user
   * @param options Sign up options
   */
  public async signUp(options: SignInOptions): Promise<void> {
    return this.signIn(options);
  }

  /**
   * Signs out the user and redirects to the sign-in page
   */
  public async signOut(): Promise<void> {
    if (this.client) {
      if (typeof this.client.logout === "function") {
        await this.client.logout();
      }
    }
    this.clearAuthCookies();
    this.onSignOut();
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
  }

  /**
   * Refreshes the session if necessary
   */
  public async refreshSession(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const refreshToken = cookieUtils.getCookie(
        AUTH_COOKIES.REFRESH_TOKEN.name
      );

      if (!this.validateRefreshToken(refreshToken)) {
        return;
      }

      if (cookieUtils.shouldRefreshAccessToken()) {
        await this.refreshTokenWithServer(refreshToken);
      }
    } catch (error) {
      this.handleAuthError();
    }
  }

  /**
   * Executes an operation, refreshing the token if necessary
   * @param operation Operation to execute
   * @returns Result of the operation
   */
  public async executeWithRefresh<T>(operation: () => Promise<T>): Promise<T> {
    await this.refreshIfNeeded();
    try {
      return await operation();
    } catch (error: any) {
      if (this.isTokenError(error)) {
        return await this.retryOperationWithFreshToken(operation);
      }
      throw error;
    }
  }

  /**
   * Handles OAuth2 signup
   * @param tokens OAuth2 tokens
   */
  public async handleOAuth2Signup(tokens: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  }): Promise<void> {
    this.setTokensOnClient(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.idToken
    );
    cookieUtils.saveAuthTokens(
      tokens.idToken,
      tokens.accessToken,
      tokens.refreshToken
    );

    this.setSession({ isAuthenticated: true });
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Saves tokens in cookies and updates the session
   */
  private saveTokensAndUpdateSession(): void {
    try {
      let idToken = "";
      let accessToken = "";
      let refreshToken = "";

      if (typeof this.client.getIdToken === "function") {
        idToken = this.client.getIdToken();
      } else if ((this.client as any).idToken) {
        idToken = (this.client as any).idToken;
      }

      if (typeof this.client.getAccessToken === "function") {
        accessToken = this.client.getAccessToken();
      } else if ((this.client as any).accessToken) {
        accessToken = (this.client as any).accessToken;
      }

      if (typeof this.client.getRefreshToken === "function") {
        refreshToken = this.client.getRefreshToken();
      } else if ((this.client as any).refreshToken) {
        refreshToken = (this.client as any).refreshToken;
      }

      if (!accessToken || !refreshToken) {
        return;
      }

      cookieUtils.saveAuthTokens(idToken, accessToken, refreshToken);
      this.setSession({ isAuthenticated: true });
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Clears authentication cookies
   */
  private clearAuthCookies(): void {
    cookieUtils.clearAuthTokens();
    this.setSession({ isAuthenticated: false });
  }

  /**
   * Sets tokens on the client
   */
  private setTokensOnClient(
    accessToken: string,
    refreshToken?: string,
    idToken?: string
  ): void {
    try {
      if (typeof this.client.setAccessToken === "function") {
        this.client.setAccessToken(accessToken);
      } else {
        (this.client as any).accessToken = accessToken;
      }

      if (refreshToken) {
        if (typeof this.client.setRefreshToken === "function") {
          this.client.setRefreshToken(refreshToken);
        } else {
          (this.client as any).refreshToken = refreshToken;
        }
      }

      if (idToken) {
        if (typeof this.client.setIdToken === "function") {
          this.client.setIdToken(idToken);
        } else {
          (this.client as any).idToken = idToken;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Authenticates with the specified provider
   */
  private async authenticateWithProvider(
    options: SignInOptions
  ): Promise<void> {
    switch (options.provider) {
      case AuthProvider.CREDENTIALS:
        return await this.client.login(
          options.credentials!.username,
          options.credentials!.password
        );
      case AuthProvider.GITHUB:
        if (!options.oauthCode) {
          throw new Error("OAuth code is required for GitHub authentication");
        }
        return await this.client.loginWithOauth2Code(
          "GITHUB",
          options.oauthCode
        );
        break;
      case AuthProvider.GOOGLE:
        throw new Error("Google authentication not implemented");
      default:
        throw new Error("Invalid authentication provider");
    }
  }

  /**
   * Validates the refresh token
   */
  private validateRefreshToken(refreshToken: string | null): boolean {
    if (!refreshToken) {
      this.handleAuthError();
      return false;
    }

    if (tokenUtils.isTokenExpired(refreshToken)) {
      this.handleAuthError();
      return false;
    }

    return true;
  }

  /**
   * Refreshes the token with the server
   */
  private async refreshTokenWithServer(
    refreshToken: string | null
  ): Promise<void> {
    if (!refreshToken) {
      this.handleAuthError();
      return;
    }

    try {
      await this.client.loginWithRefreshToken(refreshToken);
      this.saveTokensAndUpdateSession();
    } catch (refreshError) {
      this.handleAuthError();
    }
  }

  /**
   * Handles an authentication error
   */
  private handleAuthError(): void {
    this.clearAuthCookies();
    this.onSignOut();
  }

  /**
   * Refreshes the token if necessary
   */
  private async refreshIfNeeded(): Promise<void> {
    if (cookieUtils.shouldRefreshAccessToken()) {
      try {
        await this.refreshSession();
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * Checks if an error is related to the token
   */
  private isTokenError(error: any): boolean {
    return (
      error?.message?.includes("token expired") ||
      error?.message?.includes("invalid token")
    );
  }

  /**
   * Retries an operation with a fresh token
   */
  private async retryOperationWithFreshToken<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      await this.refreshSession();
      return await operation();
    } catch (refreshError) {
      throw refreshError;
    }
  }
}
