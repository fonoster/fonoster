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
  useLayoutEffect,
  useMemo,
  useState
} from "react";
import type {
  FonosterContextValue,
  FonosterProviderProps
} from "./fonoster.interfaces";
import type { Session } from "~/auth/services/sessions/session.interfaces";
import { Splash } from "~/core/components/general/splash/splash";
import { getClient, type Client } from "../client/fonoster.client";
import { useNavigate } from "react-router";
import { refreshClientSession } from "~/core/helpers/token-validators";

export const FonosterContext = createContext<FonosterContextValue | null>(null);

export const FonosterProvider = ({
  children,
  initialSession
}: FonosterProviderProps) => {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isInitialized, setIsInitialized] = useState(false);

  useLayoutEffect(() => {
    setClient(getClient());
  }, []);

  const isAuthenticated = useMemo(
    () => Boolean(session?.refreshToken),
    [session]
  );

  const logout = useCallback(() => {
    client?.logout();
    setSession(null);
  }, [client]);

  const value = useMemo(
    () => ({ logout, client, session, setSession, isAuthenticated }),
    [logout, client, session, isAuthenticated]
  );

  const authenticate = useCallback(
    async (sessionToAuth: Session) => {
      if (!client) return;

      const updatedSession = await refreshClientSession(sessionToAuth, client);
      const merged = { ...sessionToAuth, ...updatedSession };

      setSession((prev) =>
        JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged
      );
    },
    [client]
  );

  useEffect(() => {
    if (!client) return;

    if (!session) {
      setIsInitialized(true);
      return;
    }

    authenticate(session)
      .catch(() => navigate("/auth/logout"))
      .finally(() => setIsInitialized(true));
  }, [client, session, authenticate]);

  if (!isInitialized) return <Splash />;

  return (
    <FonosterContext.Provider value={value}>
      {children}
    </FonosterContext.Provider>
  );
};
