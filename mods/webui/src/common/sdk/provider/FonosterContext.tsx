/// <reference types="react" />
import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import * as SDK from '@fonoster/sdk';
import { setCookie, getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import { LoadingScreen } from '@/common/components/loading/LoadingScreen';

export interface Session {
  isAuthenticated: boolean;
  userIdToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

export enum AuthProvider {
  CREDENTIALS = 'credentials',
  GOOGLE = 'google',
  GITHUB = 'github',
  OTHER = 'other'
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

export interface FonosterContextType {
  client: SDK.WebClient
  isInitialized: boolean;
  authentication: {
    signIn: (options: SignInOptions) => Promise<void>;
    signOut: () => Promise<void>;
  };
  session: Session;
}

export const FonosterContext = createContext<FonosterContextType>({
  client: null,
  isInitialized: false,
  authentication: {
    signIn: async () => { },
    signOut: async () => { }
  },
  session: { isAuthenticated: false }
});

export const useFonoster = () => {
  const context = useContext(FonosterContext);
  if (!context) {
    throw new Error('useFonoster must be used within FonosterProvider');
  }
  return context;
};

export const FonosterProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [session, setSession] = useState<Session>({ isAuthenticated: false });
  const [client, setClient] = useState<SDK.WebClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const saveTokensAndUpdateSession = (client: SDK.WebClient) => {
    const idToken = client.getIdToken();
    const accessToken = client.getAccessToken();
    const refreshToken = client.getRefreshToken();

    setCookie('idToken', idToken, {
      maxAge: 60 * 60 * 24,
      path: '/'
    });
    setCookie('accessToken', accessToken, {
      maxAge: 60 * 60 * 24,
      path: '/'
    });
    setCookie('refreshToken', refreshToken, {
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    setSession({
      isAuthenticated: true,
      userIdToken: idToken,
      accessToken,
      refreshToken
    });
  };

  const clearAuthCookies = () => {
    setCookie('idToken', '', { maxAge: 0, path: '/' });
    setCookie('accessToken', '', { maxAge: 0, path: '/' });
    setCookie('refreshToken', '', { maxAge: 0, path: '/' });
  };

  useEffect(() => {
    let mounted = true;

    const initializeFonosterClient = async () => {
      if (!mounted) return;

      try {
        const config: { accessKeyId: string; url?: string } = {
          accessKeyId: process.env.NEXT_PUBLIC_FONOSTER_ACCESS_KEY_ID!
        };

        if (process.env.NEXT_PUBLIC_FONOSTER_URL) {
          config.url = process.env.NEXT_PUBLIC_FONOSTER_URL;
        }

        const newClient = new SDK.WebClient(config);
        if (!mounted) return;

        const storedRefreshToken = getCookie('refreshToken');
        const storedAccessToken = getCookie('accessToken');
        const storedIdToken = getCookie('idToken');

        if (storedRefreshToken && storedAccessToken && storedIdToken) {
          try {
            await newClient.loginWithRefreshToken(storedRefreshToken);
            if (!mounted) return;

            saveTokensAndUpdateSession(newClient);
          } catch (error) {
            if (!mounted) return;
            clearAuthCookies();
          }
        }

        setClient(newClient);
        setIsInitialized(true);
      } catch (error) {
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeFonosterClient();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (options: SignInOptions) => {
    if (!client) throw new Error('Client is not initialized');
    try {
      switch (options.provider) {
        case AuthProvider.CREDENTIALS:
          await client.login(options.credentials!.username, options.credentials!.password);
          break;
        case AuthProvider.GITHUB:
          if (!options.oauthCode) {
            throw new Error('OAuth code is required for GitHub authentication');
          }
          await client.loginWithOauth2Code("GITHUB", options.oauthCode);
          break;
        case AuthProvider.GOOGLE:
          // Commented out for future implementation
          // await client.loginWithOauth2Code("GOOGLE", options.oauthCode);
          throw new Error('Google authentication not implemented');
        default:
          throw new Error('Invalid authentication provider');
      }

      saveTokensAndUpdateSession(client);
    } catch (error) {
      console.error('signIn error', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (client) {
      try {
        client.logout?.() || null;
      } catch (error) {
      }
    }
    clearAuthCookies();
    setSession({ isAuthenticated: false });
    setClient(null);
    setIsInitialized(false);
    router.push('/signin');
  };

  const value = useMemo(
    () => ({
      client,
      isInitialized,
      authentication: {
        signIn,
        signOut
      },
      session
    }),
    [client, isInitialized, session]
  );

  if (isLoading) {
    return <LoadingScreen logoSize="large" />;
  }

  return (
    <FonosterContext.Provider value={value}>
      {children}
    </FonosterContext.Provider>
  );
};
