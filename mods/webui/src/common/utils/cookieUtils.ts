import {
  setCookie as setNextCookie,
  getCookie as getNextCookie,
  deleteCookie as deleteNextCookie
} from "cookies-next";
import { tokenUtils } from "./tokenUtils";

/**
 * Authentication cookies configuration
 */
export const AUTH_COOKIES = {
  ID_TOKEN: {
    name: "idToken",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/"
  },
  ACCESS_TOKEN: {
    name: "accessToken",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/"
  },
  REFRESH_TOKEN: {
    name: "refreshToken",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/"
  }
};

/**
 * Utilities for handling cookies
 */
export const cookieUtils = {
  /**
   * Sets a cookie
   * @param name Cookie name
   * @param value Cookie value
   * @param options Cookie options
   */
  setCookie: (
    name: string,
    value: string,
    options: { maxAge?: number; path?: string } = {}
  ) => {
    try {
      // Asegurar que las opciones incluyan secure y sameSite
      const cookieOptions = {
        ...options,
        // En desarrollo, no usar secure para permitir pruebas locales
        secure: process.env.NODE_ENV === "production",
        // Usar 'lax' para permitir redirecciones
        sameSite: "lax" as const
      };

      setNextCookie(name, value, cookieOptions);
    } catch (error) {
      // Silently handle error
    }
  },

  /**
   * Gets a cookie value
   * @param name Cookie name
   * @returns Cookie value or null if it doesn't exist
   */
  getCookie: (name: string): string | null => {
    const value = getNextCookie(name);
    return value ? String(value) : null;
  },

  /**
   * Deletes a cookie
   * @param name Cookie name
   * @param options Cookie options
   */
  deleteCookie: (name: string, options: { path?: string } = {}) => {
    deleteNextCookie(name, options);
  },

  /**
   * Saves authentication tokens in cookies
   * @param idToken ID token
   * @param accessToken Access token
   * @param refreshToken Refresh token
   */
  saveAuthTokens: (
    idToken: string,
    accessToken: string,
    refreshToken: string
  ) => {
    try {
      cookieUtils.setCookie(AUTH_COOKIES.ID_TOKEN.name, idToken, {
        maxAge: AUTH_COOKIES.ID_TOKEN.maxAge,
        path: AUTH_COOKIES.ID_TOKEN.path
      });

      cookieUtils.setCookie(AUTH_COOKIES.ACCESS_TOKEN.name, accessToken, {
        maxAge: AUTH_COOKIES.ACCESS_TOKEN.maxAge,
        path: AUTH_COOKIES.ACCESS_TOKEN.path
      });

      cookieUtils.setCookie(AUTH_COOKIES.REFRESH_TOKEN.name, refreshToken, {
        maxAge: AUTH_COOKIES.REFRESH_TOKEN.maxAge,
        path: AUTH_COOKIES.REFRESH_TOKEN.path
      });
    } catch (error) {
      // Silently handle error
    }
  },

  /**
   * Clears authentication cookies
   */
  clearAuthTokens: () => {
    try {
      cookieUtils.deleteCookie(AUTH_COOKIES.ID_TOKEN.name, {
        path: AUTH_COOKIES.ID_TOKEN.path
      });

      cookieUtils.deleteCookie(AUTH_COOKIES.ACCESS_TOKEN.name, {
        path: AUTH_COOKIES.ACCESS_TOKEN.path
      });

      cookieUtils.deleteCookie(AUTH_COOKIES.REFRESH_TOKEN.name, {
        path: AUTH_COOKIES.REFRESH_TOKEN.path
      });
    } catch (error) {
      // Silently handle error
    }
  },

  /**
   * Checks if there are valid authentication tokens in cookies
   * @returns true if there are valid tokens, false otherwise
   */
  hasValidAuthTokens: (): boolean => {
    const accessToken = cookieUtils.getCookie(AUTH_COOKIES.ACCESS_TOKEN.name);
    const refreshToken = cookieUtils.getCookie(AUTH_COOKIES.REFRESH_TOKEN.name);

    if (!accessToken || !refreshToken) {
      return false;
    }

    if (tokenUtils.isTokenExpired(refreshToken)) {
      return false;
    }

    return true;
  },

  /**
   * Gets authentication tokens from cookies
   * @returns Object with tokens or null if they don't exist
   */
  getAuthTokens: () => {
    const idToken = cookieUtils.getCookie(AUTH_COOKIES.ID_TOKEN.name);
    const accessToken = cookieUtils.getCookie(AUTH_COOKIES.ACCESS_TOKEN.name);
    const refreshToken = cookieUtils.getCookie(AUTH_COOKIES.REFRESH_TOKEN.name);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return {
      idToken,
      accessToken,
      refreshToken
    };
  },

  /**
   * Checks if the access token needs to be refreshed
   * @returns true if the token needs to be refreshed, false otherwise
   */
  shouldRefreshAccessToken: (): boolean => {
    const accessToken = cookieUtils.getCookie(AUTH_COOKIES.ACCESS_TOKEN.name);
    return tokenUtils.shouldRefreshToken(accessToken);
  }
};
