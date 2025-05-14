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
import { createCookieSessionStorage, redirect } from "react-router";
import type {
  RequiredSessionRequest,
  Session,
  SessionFlashData,
  SessionRequest
} from "./auth.interfaces";

/**
 * Environment variable for securing the session, required for cookie signing.
 */
const SESSION_SECRET = process.env.APP_SESSION_SECRET as string;

/**
 * Environment variable to determine if the session is secure.
 * In production, this should be set to true to ensure cookies are sent over HTTPS.
 */
const SESSION_IS_SECURE = Boolean(process.env.NODE_ENV === "production");

const {
  getSession: getSessionCookie,
  commitSession,
  destroySession
} = createCookieSessionStorage<Session, SessionFlashData>({
  cookie: {
    name: SESSION_IS_SECURE ? "__Secure-Session" : "__Session",
    /**
     * Prevent client-side JavaScript from accessing the cookie.
     */
    httpOnly: true,
    /**
     * Cookie is available for the entire application.
     */
    path: "/",
    /**
     * Helps prevent CSRF while allowing navigation from external sites.
     *
     */
    sameSite: "lax",
    /**
     * Used to sign and verify the integrity of the cookie.
     * example: "openssl rand -base64 32"
     */
    secrets: [SESSION_SECRET],
    /**
     * Ensures cookies are sent only over HTTPS in production.
     */
    secure: SESSION_IS_SECURE
  }
});

/**
 * Retrieves the session from request headers and determines authentication status.
 *
 * @param headers - Cookie header from the HTTP request
 * @returns An object containing session data (if present) and authentication status
 */
export const getSession = async (
  headers: string | null
): Promise<SessionRequest> => {
  const session = await getSessionCookie(headers);

  const isAuthenticated = Boolean(session.get("idToken"));

  if (!isAuthenticated) {
    return { session: null, isAuthenticated };
  }

  const sessionData: Session = {
    idToken: String(session.get("idToken")),
    accessToken: String(session.get("accessToken")),
    refreshToken: String(session.get("refreshToken"))
  };

  return { session: sessionData, isAuthenticated };
};

/**
 * Ensures that a session is present. If not, redirects to the login page.
 *
 * @param headers - Cookie header from the HTTP request
 * @throws Redirects to the login page if no valid session is found
 * @returns A strongly typed session and auth status
 */
export const getRequiredSession = async (
  headers: string | null
): Promise<RequiredSessionRequest> => {
  const { session, ...rest } = await getSession(headers);

  /**
   * Retrieve raw session for cookie destruction in case of redirection.
   */
  const sessionCookie = await getSessionCookie(headers);

  /**
   * If session is missing, redirect to login and clear existing cookie.
   * This is important to prevent unauthorized access to protected routes.
   * The session is destroyed to ensure that the user cannot access any
   * protected resources without re-authenticating.
   */
  if (!session) {
    throw redirect("/auth/login", {
      headers: {
        "Set-Cookie": await destroySession(sessionCookie)
      }
    });
  }

  return { session, ...rest };
};

/**
 * Exports the session management functions for use in other parts of the application.
 *
 * - getSession: Retrieves the session and authentication status.
 * - getRequiredSession: Ensures a valid session is present, redirecting if not.
 * - commitSession: Commits the session to storage.
 * - destroySession: Destroys the session and clears cookies.
 */
export { getSessionCookie, commitSession, destroySession };
