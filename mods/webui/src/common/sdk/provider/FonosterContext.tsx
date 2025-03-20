/// <reference types="react" />
import React, {
  createContext,
  useState,
  useMemo,
  useEffect,
  useContext
} from "react";
import {
  WebClient,
  createFonosterClient,
  SDK_CONFIG
} from "@/common/sdk/config/sdkConfig";
import { LoadingScreen } from "@/common/components/loading/LoadingScreen";
import { AuthClient, AuthProvider } from "@/common/sdk/auth/AuthClient";

// Type definitions
export interface Session {
  isAuthenticated: boolean;
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
  client: WebClient | null;
  isInitialized: boolean;
  session: Session;
  setSession: (session: Session) => void;
  authClient: AuthClient | null;
}

export const FonosterContext = createContext<FonosterContextType>({
  client: null,
  isInitialized: false,
  session: { isAuthenticated: false },
  setSession: () => {},
  authClient: null
});

/**
 * Hook to access the Fonoster context
 * @returns The Fonoster context
 */
export const useFonoster = () => {
  const context = useContext(FonosterContext);
  if (!context) {
    throw new Error("useFonoster must be used within FonosterProvider");
  }
  return context;
};

/**
 * Provider for the Fonoster context
 * @param children Child components
 */
export const FonosterProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // State
  const [client, setClient] = useState<WebClient | null>(null);
  const [session, setSession] = useState<Session>({ isAuthenticated: false });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted || initializationAttempted) return;
      setInitializationAttempted(true);

      try {
        const config: { url?: string } = {};

        if (SDK_CONFIG.API_URL) {
          config.url = SDK_CONFIG.API_URL;
        }

        const newClient = createFonosterClient(config);
        if (!mounted) return;

        if (!authClient) {
          const newAuthClient = new AuthClient(
            newClient,
            (newSession) => {
              if (mounted) {
                setSession(newSession);
              }
            },
            () => {}
          );
          const initialized = newAuthClient.initializeWithStoredTokens();
          setAuthClient(newAuthClient);
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

    initialize();
    return () => {
      mounted = false;
    };
  }, [authClient, initializationAttempted]);

  const value = useMemo(
    () => ({
      client,
      isInitialized,
      session,
      setSession,
      authClient
    }),
    [client, isInitialized, session, authClient]
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
