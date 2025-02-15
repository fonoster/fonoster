import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

export const tokenUtils = {
  isTokenExpired: (token: string | null): boolean => {
    if (!token) return true;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  },

  shouldRefreshToken: (accessToken: string | null): boolean => {
    if (!accessToken) return true;

    try {
      const decoded = jwtDecode<DecodedToken>(accessToken);
      const currentTime = Date.now() / 1000;
      return decoded.exp - currentTime < 300;
    } catch {
      return true;
    }
  },

  getTokenExpirationTime: (token: string | null): number | null => {
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp;
    } catch {
      return null;
    }
  }
}; 