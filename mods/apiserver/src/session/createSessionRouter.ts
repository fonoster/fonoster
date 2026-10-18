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
import { getLogger } from "@fonoster/logger";
import { status as grpcStatus } from "@grpc/grpc-js";
import express, { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** Where the router is mounted; the cookie is scoped to this path (M4). */
export const SESSION_PATH = "/api/session";

/** The httpOnly cookie that holds the dashboard's refresh token. */
export const SESSION_COOKIE = "fonoster_session";

/** Required on every request, so a plain cross-site form or link can't use the cookie. */
export const CSRF_HEADER = "x-requested-with";

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
};

/** Identity's ExchangeRefreshToken and RevokeToken, called in-process. */
export type SessionIdentity = {
  exchangeRefreshToken(refreshToken: string): Promise<SessionTokens>;
  revokeToken(refreshToken: string): Promise<void>;
};

/** Rejection from Identity: a gRPC status code. */
export class SessionIdentityError extends Error {
  constructor(
    readonly code: number,
    message: string
  ) {
    super(message);
  }
}

export type SessionRouterDeps = {
  identity: SessionIdentity;
  /**
   * Mark the cookie Secure. True when the app URL is https (the default); a plain-http
   * deployment can't use Secure cookies, browsers would drop them.
   */
  secureCookie: boolean;
};

/** Codes that mean "this refresh token is no good", not "Identity is down". */
const REFUSED = new Set<number>([
  grpcStatus.UNAUTHENTICATED,
  grpcStatus.PERMISSION_DENIED,
  grpcStatus.INVALID_ARGUMENT,
  grpcStatus.NOT_FOUND
]);

function readCookie(req: Request, name: string): string | undefined {
  const part = (req.headers.cookie ?? "")
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${name}=`));
  if (!part) return undefined;
  try {
    return decodeURIComponent(part.slice(name.length + 1)) || undefined;
  } catch {
    return undefined;
  }
}

/** Seconds until the token's `exp`, or undefined when it has none. */
function secondsLeft(token: string): number | undefined {
  const claims = jwt.decode(token);
  if (!claims || typeof claims === "string" || typeof claims.exp !== "number")
    return undefined;
  return Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
}

/**
 * The dashboard's session (security review M4): the refresh token lives in an httpOnly,
 * SameSite=Strict cookie scoped to /api/session, so page scripts (and any XSS) never read it;
 * the dashboard keeps only the access and id tokens, in memory.
 *
 *   POST /api/session          {refreshToken}: adopts a token from a fresh sign-in. It is
 *                              rotated at once, so the copy the page saw is already spent.
 *   POST /api/session/refresh  rotates the cookie's token, returns new access and id tokens
 *   POST /api/session/logout   revokes the cookie's token family and clears the cookie
 *
 * Every request needs the `X-Requested-With` header (CSRF, besides SameSite=Strict); without
 * it the answer is 403. The responses carry {accessToken, idToken, expiresAt}, never the
 * refresh token. Envoy serves this on the dashboard's origin (its existing /api route), so no
 * CORS is involved. SDK and API clients are unaffected: they keep exchanging refresh tokens
 * over gRPC.
 */
export function createSessionRouter(deps: SessionRouterDeps): Router {
  const router = express.Router();
  const cookieOptions = {
    httpOnly: true,
    secure: deps.secureCookie,
    sameSite: "strict" as const,
    path: SESSION_PATH
  };

  const setSession = (res: Response, refreshToken: string) => {
    const left = secondsLeft(refreshToken);
    res.cookie(SESSION_COOKIE, refreshToken, {
      ...cookieOptions,
      ...(left !== undefined ? { maxAge: left * 1000 } : {})
    });
  };

  const clearSession = (res: Response) =>
    res.clearCookie(SESSION_COOKIE, cookieOptions);

  const body = (tokens: SessionTokens) => {
    const claims = jwt.decode(tokens.accessToken);
    const exp =
      claims && typeof claims !== "string" && typeof claims.exp === "number"
        ? claims.exp
        : undefined;
    return {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      ...(exp !== undefined ? { expiresAt: exp } : {})
    };
  };

  /** Rotates `refreshToken` and answers with the new session (or 401/503). */
  const rotate = async (res: Response, refreshToken: string) => {
    try {
      const tokens = await deps.identity.exchangeRefreshToken(refreshToken);
      setSession(res, tokens.refreshToken);
      res.json(body(tokens));
    } catch (error) {
      if (error instanceof SessionIdentityError && REFUSED.has(error.code)) {
        clearSession(res);
        res.status(401).json({ error: "invalid_session" });
        return;
      }
      logger.warn("session refresh failed", {
        error: (error as Error).message
      });
      res.status(503).json({ error: "unavailable" });
    }
  };

  router.use((req, res, next) => {
    res.setHeader("cache-control", "no-store");
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }
    if (!req.get(CSRF_HEADER)) {
      res.status(403).json({ error: "missing_csrf_header" });
      return;
    }
    next();
  });

  router.post("/", express.json({ limit: "16kb" }), async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (typeof refreshToken !== "string" || !refreshToken) {
      res.status(400).json({ error: "refresh_token_required" });
      return;
    }
    await rotate(res, refreshToken);
  });

  router.post("/refresh", async (req, res) => {
    const refreshToken = readCookie(req, SESSION_COOKIE);
    if (!refreshToken) {
      res.status(401).json({ error: "no_session" });
      return;
    }
    await rotate(res, refreshToken);
  });

  router.post("/logout", async (req, res) => {
    const refreshToken = readCookie(req, SESSION_COOKIE);
    clearSession(res);
    if (refreshToken) {
      // Best effort, like the SDK's logout: an already-refused token has nothing to revoke.
      await deps.identity.revokeToken(refreshToken).catch((error) => {
        logger.verbose("session revoke failed", {
          error: (error as Error).message
        });
      });
    }
    res.status(204).end();
  });

  return router;
}

type UnaryHandler = (
  call: { request: unknown },
  callback: (
    error?: { code?: number; message?: string } | null,
    response?: unknown
  ) => void
) => unknown;

function unary<T>(handler: UnaryHandler, request: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    Promise.resolve(
      handler({ request }, (error, response) => {
        if (error)
          reject(
            new SessionIdentityError(
              error.code ?? grpcStatus.UNKNOWN,
              error.message ?? "identity error"
            )
          );
        else resolve(response as T);
      })
    ).catch(reject);
  });
}

/** Binds the router to the in-process Identity service's gRPC handlers. */
export function identityFromHandlers(
  handlers: Record<string, unknown>
): SessionIdentity {
  const exchange = handlers.exchangeRefreshToken as UnaryHandler | undefined;
  const revoke = handlers.revokeToken as UnaryHandler | undefined;
  if (!exchange || !revoke)
    throw new Error("the Identity service is not loaded in this apiserver");
  return {
    exchangeRefreshToken: (refreshToken) =>
      unary<SessionTokens>(exchange, { refreshToken }),
    revokeToken: async (token) => {
      await unary(revoke, { token });
    }
  };
}
