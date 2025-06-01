/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type {
  FonosterContextValue,
  FonosterProviderProps
} from "./fonoster.interfaces";
import type { CookieSession } from "~/auth/services/sessions/session.interfaces";
import { Splash } from "~/core/components/general/splash/splash";
import { useNavigate } from "react-router";
import { refreshClientSession } from "~/core/helpers/token-validators";
import { useClient } from "../hooks/use-fonoster-client";
import { Logger } from "~/core/shared/logger";

/**
 * React context used to provide access to the Fonoster client, session,
 * authentication state, and SDK modules throughout the application.
 */
export const FonosterContext = createContext<FonosterContextValue | null>(null);

/**
 * Provider component that initializes the Fonoster client, handles
 * authentication state, and exposes SDK functionality to children components.
 *
 * This component should wrap your application (or parts of it) that require
 * access to Fonoster services.
 *
 * @param children - React children to render inside the context provider.
 * @param initialSession - Initial session passed in from persistent state or server.
 */
export const FonosterProvider = ({
  children,
  initialSession
}: FonosterProviderProps) => {
  /**
   * Tracks whether the provider has already attempted to authenticate
   * the session. This prevents multiple authentication attempts
   * on initial load.
   */
  const hasAuthenticated = useRef(false);

  /**
   * Tracks whether the provider has completed initialization
   * (e.g. validating the session or setting up the client).
   */
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Hook that encapsulates all Fonoster-related logic, such as client setup,
   * SDK initialization, session management, and authentication helpers.
   */
  const {
    sdk,
    client,
    session,
    setSession,
    isAuthenticated,
    logout,
    updateSessionTokens
  } = useClient();

  /**
   * React Router hook used for programmatic navigation (e.g. on session expiry).
   */
  const navigate = useNavigate();

  /**
   * Authenticates the current session by refreshing the access token.
   * If the refresh is successful, updates the internal session state.
   *
   * @param sessionToAuth - The session object to authenticate.
   */
  const authenticate = useCallback(
    async (sessionToAuth: CookieSession) => {
      if (!client) return;

      Logger.debug("[<FonosterProvider />] Authenticating session...");
      const updatedSession = await refreshClientSession(sessionToAuth, client);
      Logger.debug(
        "[<FonosterProvider />] Session authenticated successfully."
      );
      updateSessionTokens(updatedSession);
    },
    [client, updateSessionTokens]
  );

  /**
   * On initial load or when client/session changes, attempts to validate
   * and refresh the session. If session is missing or invalid, redirects to logout.
   */
  useEffect(() => {
    if (!client || hasAuthenticated.current) return;

    Logger.debug("[<FonosterProvider />] Initializing Fonoster client...");

    hasAuthenticated.current = true;

    if (!initialSession) {
      Logger.debug(
        "[<FonosterProvider />] No initial session found, initializing without session."
      );
      setIsInitialized(true);
      return;
    }

    authenticate(initialSession)
      .catch(() => navigate("/auth/logout?auto_logout=true"))
      .finally(() => setIsInitialized(true));
  }, [client, session, authenticate]);

  /**
   * Memoized context value to avoid unnecessary re-renders in consuming components.
   */
  const value = useMemo(
    () => ({
      client,
      session,
      setSession,
      logout,
      isAuthenticated,
      sdk,
      authenticate
    }),
    [client, session, logout, isAuthenticated, sdk]
  );

  /**
   * Displays a splash screen while the provider is initializing.
   */
  if (!isInitialized) {
    return <Splash message="Initializing Fonoster services..." />;
  }

  /**
   * Renders the provider and makes Fonoster services available to descendants.
   */
  return (
    <FonosterContext.Provider value={value}>
      {children}
    </FonosterContext.Provider>
  );
};
