import { jwtDecode } from "jwt-decode";

/**
 * Interface for the decoded token
 */
interface DecodedToken {
  exp: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

/**
 * Utilities for handling JWT tokens
 */
export const tokenUtils = {
  /**
   * Checks if a token has expired
   * @param token JWT token
   * @returns true if the token has expired or is invalid, false otherwise
   */
  isTokenExpired: (token: string | null): boolean => {
    if (!token) {
      return true;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  },

  /**
   * Checks if a token should be refreshed
   * @param token JWT token
   * @param thresholdMinutes Minutes before expiration to consider it should be refreshed
   * @returns true if the token should be refreshed, false otherwise
   */
  shouldRefreshToken: (
    token: string | null,
    thresholdMinutes: number = 5
  ): boolean => {
    if (!token) return true;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded.exp) return true;

      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // If the token expires in less than the threshold, it should be refreshed
      return timeUntilExpiry < thresholdMinutes * 60 * 1000;
    } catch (error) {
      return true;
    }
  },

  /**
   * Gets the expiration time of a token
   * @param token JWT token
   * @returns Expiration time in seconds since UNIX epoch, or null if the token is invalid
   */
  getTokenExpirationTime: (token: string | null): number | null => {
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp;
    } catch (error) {
      return null;
    }
  },

  /**
   * Decodes a JWT token
   * @param token JWT token
   * @returns Decoded token or null if the token is invalid
   */
  decodeToken: (token: string | null): DecodedToken | null => {
    if (!token) return null;

    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      return null;
    }
  },

  /**
   * Gets the time remaining until a token expires
   * @param token JWT token
   * @returns Time remaining in milliseconds, or 0 if the token is invalid or has expired
   */
  getTimeUntilExpiry: (token: string | null): number => {
    if (!token) return 0;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded.exp) return 0;

      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      return Math.max(0, timeUntilExpiry);
    } catch (error) {
      return 0;
    }
  },

  /**
   * Checks if a token is valid
   * @param token JWT token
   * @returns true if the token is valid and has not expired, false otherwise
   */
  isTokenValid: (token: string | null): boolean => {
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      // Check that the token has an expiration date and has not expired
      return !!decoded.exp && decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  /**
   * Gets the subject ID from the token
   * @param token JWT token
   * @returns Subject ID or null if the token is invalid or has no subject
   */
  getSubjectId: (token: string | null): string | null => {
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.sub || null;
    } catch (error) {
      return null;
    }
  }
};
