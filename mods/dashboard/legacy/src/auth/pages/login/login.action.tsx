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
import type { Route } from "./+types/login.page";
import { redirect } from "react-router";
import { parseLoginError } from "~/auth/helpers/parse-login-error";
import {
  commitSession,
  getSessionCookie
} from "~/auth/services/sessions/session.server";
import { getClient } from "~/core/sdk/client/fonoster.server";

/**
 * Action handler for processing the login form submission.
 *
 * Handles form data extraction, validation, client authentication,
 * session cookie management, and redirects accordingly.
 *
 * @param request - The incoming request object from Remix.
 * @returns A redirect response, either to the home page on success,
 * or back to the login page with an error message on failure.
 */
export async function action({ request }: Route.ActionArgs) {
  /** Initialize the API client for Fonoster authentication. */
  const client = getClient();

  /** Retrieve the session cookie from the incoming request headers. */
  const cookie = await getSessionCookie(request.headers.get("Cookie"));

  try {
    /** Parse the submitted form data. */
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");

    /** Basic validation: ensure both email and password are provided. */
    if (!email || !password) {
      throw new Error(
        "Oops! Missing email or password for login. Please try again."
      );
    }

    /** Attempt to authenticate using the Fonoster client. */
    await client.login(email.toString(), password.toString());

    /** Store tokens in the session cookie for future authenticated requests. */
    cookie.set("refreshToken", client.getRefreshToken());

    /** Redirect to the home page after successful login, with updated cookies. */
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(cookie)
      }
    });
  } catch (error: any) {
    /** Parse a user-friendly error message from the caught exception. */
    const message = parseLoginError(error);

    /** Redirect back to the login page with an error message in the query string. */
    return redirect(`/auth/login?error=${encodeURIComponent(message)}`, {
      headers: {
        "Set-Cookie": await commitSession(cookie)
      }
    });
  }
}
