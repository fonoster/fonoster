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
import { createSdk, type DashboardClient, type FonosterSdk } from "./client";
import { GrpcCode, grpcCode } from "./errors";
import {
  decodeJwt,
  msUntilExpiry,
  type AccessTokenClaims,
  type IdTokenClaims
} from "./jwt";
import { LEGACY_SESSION_KEY, storage } from "./storage";

/**
 * What the dashboard keeps, in memory only. The refresh token is in an
 * httpOnly cookie the page can't read (M4).
 */
export type Session = {
  accessToken: string;
  idToken: string;
};

type Status = "restoring" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: Status;
  /** Why the last session ended; the sign-in redirect keeps the path only when it expired. */
  endedBy: "user" | "expiry" | null;
  client: DashboardClient;
  sdk: FonosterSdk;
  user: IdTokenClaims | null;
  /** The user's role per workspace, as of sign-in or the last refresh. */
  access: NonNullable<AccessTokenClaims["access"]>;
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

/**
 * Older dashboards kept the whole session in localStorage. Removes it (on
 * every load, so nothing token-like stays behind) and returns its refresh
 * token, so that sign-in can move into the cookie instead of being lost.
 */
function takeLegacyRefreshToken(): string | null {
  const legacy = storage.getJson<{ refreshToken?: unknown }>(
    LEGACY_SESSION_KEY
  );
  storage.remove(LEGACY_SESSION_KEY);
  return typeof legacy?.refreshToken === "string" && legacy.refreshToken
    ? legacy.refreshToken
    : null;
}

export function AuthProvider({
  client,
  children
}: {
  client: DashboardClient;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const here = useRef("/");
  here.current = location.pathname + location.search;
  const [session, setSession] = useState<Session | null>(null);
  // Only the server knows whether the cookie holds a session, so every load
  // starts by asking.
  const [status, setStatus] = useState<Status>("restoring");
  const [endedBy, setEndedBy] = useState<"user" | "expiry" | null>(null);

  const adopt = useCallback(() => {
    setSession({
      accessToken: client.getAccessToken(),
      idToken: client.getIdToken()
    });
    clearInvite();
    setEndedBy(null);
    setStatus("signedIn");
  }, [client]);

  // An expired session keeps the current path so sign-in can return to it.
  // Signing out revokes the session on the server and clears its cookie (best
  // effort, never awaited).
  const signOut = useCallback(
    (options?: { expired?: boolean }) => {
      const path = here.current;
      void client.logout();
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

  const renew = useCallback(async () => {
    try {
      await client.refreshToken();
      adopt();
    } catch (error) {
      const code = grpcCode(error);
      if (code === undefined || SIGNED_OUT_CODES.includes(code)) {
        signOut({ expired: true });
      }
      // Otherwise the API is unreachable, not refusing us: keep the session
      // (its access token works until it expires) and let the screens show
      // the API error. The next renewal tries again.
    }
  }, [client, adopt, signOut]);

  // On load, the cookie (or an older dashboard's stored session) restores
  // the session. Without one, or with the API unreachable, the user signs in.
  const restoring = useRef(false);
  useEffect(() => {
    if (restoring.current) return;
    restoring.current = true;
    const legacy = takeLegacyRefreshToken();
    void (async () => {
      try {
        if (legacy) {
          await client
            .adoptRefreshToken(legacy)
            .catch(() => client.refreshToken());
        } else {
          await client.refreshToken();
        }
        adopt();
      } catch {
        setStatus((current) =>
          current === "restoring" ? "signedOut" : current
        );
      }
    })();
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
    const timer = window.setTimeout(() => void renew(), delay);
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
      access:
        status === "signedIn"
          ? (decodeJwt<AccessTokenClaims>(session?.accessToken)?.access ?? [])
          : [],
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
        await client.refreshToken();
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
