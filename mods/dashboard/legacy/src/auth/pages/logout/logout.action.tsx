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
import { redirect } from "react-router";
import {
  destroySession,
  getSessionCookie
} from "~/auth/services/sessions/session.server";
import type { Route } from "./+types/logout.page";

/**
 * Logout action.
 * Handles user logout by:
 *  - Retrieving the current session cookie
 *  - Destroying the session on the server
 *  - Redirecting the user to the login page
 *
 * @param request - The incoming request object from Remix.
 * @returns A redirect response to the login page with the session cookie cleared.
 */
export async function action({ request }: Route.ActionArgs) {
  /** Extract the cookie header from the incoming request. */
  const headers = request.headers.get("Cookie");

  /** Retrieve the current session cookie using the cookie header. */
  const sessionCookie = await getSessionCookie(headers);

  /** Destroy the session on the server and return a redirect to the login page. */
  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await destroySession(sessionCookie)
    }
  });
}
