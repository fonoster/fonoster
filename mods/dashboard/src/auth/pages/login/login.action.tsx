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

export async function action({ request }: Route.ActionArgs) {
  const client = getClient();
  const cookie = await getSessionCookie(request.headers.get("Cookie"));

  try {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");

    if (!email || !password) {
      throw new Error(
        "Oops! Missing email or password for login. Please try again."
      );
    }

    await client.login(email.toString(), password.toString());

    cookie.set("accessToken", client.getAccessToken());
    cookie.set("refreshToken", client.getRefreshToken());
    cookie.set("idToken", client.getIdToken());

    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(cookie)
      }
    });
  } catch (error: any) {
    const message = parseLoginError(error);

    return redirect(`/auth/login?error=${encodeURIComponent(message)}`, {
      headers: {
        "Set-Cookie": await commitSession(cookie)
      }
    });
  }
}
