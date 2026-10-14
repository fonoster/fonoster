/**
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
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearInvite } from "~/auth/invite";
import { createSdk, type FonosterSdk, type WebClient } from "./client";
import { GrpcCode, grpcCode } from "./errors";
import { decodeJwt, msUntilExpiry, type IdTokenClaims } from "./jwt";
import { STORAGE_KEYS, storage } from "./storage";

export type Session = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
};

type Status = "restoring" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: Status;
  /** Why the last session ended; the sign-in redirect keeps the path only when it expired. */
  endedBy: "user" | "expiry" | null;
  client: WebClient;
  sdk: FonosterSdk;
  user: IdTokenClaims | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithCode: (email: string, code: string) => Promise<void>;
  signInWithGitHub: (code: string) => Promise<void>;
  /** Re-reads the tokens, e.g. after a password change clears mustChangePassword. */
  refreshSession: () => Promise<void>;
  signOut: (options?: { expired?: boolean }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Refresh this long before the access token expires. */
const REFRESH_MARGIN_MS = 60_000;

const SIGNED_OUT_CODES: number[] = [
  GrpcCode.UNAUTHENTICATED,
  GrpcCode.PERMISSION_DENIED,
  GrpcCode.INVALID_ARGUMENT,
  GrpcCode.NOT_FOUND
];

function sessionOf(client: WebClient): Session {
  return {
    accessToken: client.getAccessToken(),
    refreshToken: client.getRefreshToken(),
    idToken: client.getIdToken()
  };
}

export function AuthProvider({
  client,
  children
}: {
  client: WebClient;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const here = useRef("/");
  here.current = location.pathname + location.search;
  const [session, setSession] = useState<Session | null>(() =>
    storage.getJson<Session>(STORAGE_KEYS.session)
  );
  const [status, setStatus] = useState<Status>(() =>
    session ? "restoring" : "signedOut"
  );
  const [endedBy, setEndedBy] = useState<"user" | "expiry" | null>(null);

  const adopt = useCallback(() => {
    const next = sessionOf(client);
    storage.setJson(STORAGE_KEYS.session, next);
    setSession(next);
    clearInvite();
    setEndedBy(null);
    setStatus("signedIn");
  }, [client]);

  // An expired session keeps the current path so sign-in can return to it.
  const signOut = useCallback(
    (options?: { expired?: boolean }) => {
      const path = here.current;
      client.logout();
      storage.remove(STORAGE_KEYS.session);
      storage.remove(STORAGE_KEYS.workspace);
      client.setAccessKeyId("");
      queryClient.clear();
      setSession(null);
      setEndedBy(options?.expired ? "expiry" : "user");
      setStatus("signedOut");
      const next =
        options?.expired && path !== "/"
          ? `?next=${encodeURIComponent(path)}`
          : "";
      navigate(`/sign-in${next}`, { replace: true });
    },
    [client, queryClient, navigate]
  );

  const renew = useCallback(
    async (refreshToken: string) => {
      try {
        await client.loginWithRefreshToken(refreshToken);
        adopt();
      } catch (error) {
        const code = grpcCode(error);
        if (code === undefined || SIGNED_OUT_CODES.includes(code)) {
          signOut({ expired: true });
        } else {
          // The API is unreachable, not refusing us: keep the session and let
          // the screens show the API error. The next renewal tries again.
          client.setAccessToken(
            storage.getJson<Session>(STORAGE_KEYS.session)?.accessToken ?? ""
          );
          setStatus("signedIn");
        }
      }
    },
    [client, adopt, signOut]
  );

  // A stored session is renewed once on load, which also checks it is still valid.
  useEffect(() => {
    if (status === "restoring" && session) void renew(session.refreshToken);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Renew shortly before the access token expires.
  useEffect(() => {
    if (status !== "signedIn" || !session) return;
    const delay = Math.max(
      0,
      msUntilExpiry(session.accessToken) - REFRESH_MARGIN_MS
    );
    const timer = window.setTimeout(
      () => void renew(session.refreshToken),
      delay
    );
    return () => window.clearTimeout(timer);
  }, [status, session, renew]);

  const sdk = useMemo(() => createSdk(client), [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      endedBy,
      client,
      sdk,
      user:
        status === "signedIn"
          ? decodeJwt<IdTokenClaims>(session?.idToken)
          : null,
      signInWithPassword: async (email, password) => {
        await client.login(email, password);
        adopt();
      },
      signInWithCode: async (email, code) => {
        await client.loginWithVerificationCode(email, code);
        adopt();
      },
      signInWithGitHub: async (code) => {
        await client.loginWithOauth2Code("GITHUB", code);
        adopt();
      },
      refreshSession: async () => {
        await client.loginWithRefreshToken(
          client.getRefreshToken() || session?.refreshToken || ""
        );
        adopt();
      },
      signOut
    }),
    [status, endedBy, client, sdk, session, adopt, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Lets stories and tests supply a fake session. */
export const AuthOverride = AuthContext.Provider;
export type { AuthContextValue };

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

/** Shorthand for screens that only call the API. */
export function useSdk(): FonosterSdk {
  return useAuth().sdk;
}
