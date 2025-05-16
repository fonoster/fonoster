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
import { data } from "react-router";
import { commitSession, getSession, getSessionCookie } from "./session.server";
import type { Route } from "../../+types/root";

export const rootAuthLoader = async ({ request }: Route.LoaderArgs) => {
  const headers = request.headers.get("Cookie");
  const session = await getSession(headers);
  const sessionCookie = await getSessionCookie(headers);

  return data(session, {
    headers: {
      "Set-Cookie": await commitSession(sessionCookie)
    }
  });
};
