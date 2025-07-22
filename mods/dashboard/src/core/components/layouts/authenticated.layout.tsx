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

import { Outlet, useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/authenticated.layout";
import { getRequiredSession } from "~/auth/services/sessions/session.server";
import { Box, styled } from "@mui/material";
import { Header } from "../general/header/header";
import { AuthenticatedProvider } from "~/auth/stores/authenticated.store";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useEffect } from "react";
import { Logger } from "~/core/shared/logger";
import { jwtDecode } from "jwt-decode";
import type { IDTokenPayload } from "~/auth/services/sessions/auth.interfaces";
import { IS_CLOUD } from "~/core/sdk/stores/fonoster.config";

export const shouldRevalidate = () => false;

/**
 * Route loader function that ensures the user is authenticated before rendering the layout.
 * If not authenticated, this function will automatically redirect to the login page
 * via `getRequiredSession()`.
 *
 * @param request - The incoming HTTP request object from Remix
 * @returns The session object if authenticated
 */
export async function loader({ request }: Route.LoaderArgs) {
  return await getRequiredSession(request.headers.get("Cookie"));
}

/**
 * Authenticated Layout component
 *
 * This is the layout for authenticated users. It wraps protected routes
 * and will eventually include a header with user information and logout functionality.
 */
export default function AuthenticatedLayout({
  loaderData: { session }
}: Route.ComponentProps) {
  const { client } = useFonoster();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!IS_CLOUD) return;

    const idToken = client.getIdToken();
    if (!idToken) return;

    const { emailVerified, phoneNumberVerified } =
      jwtDecode<IDTokenPayload>(idToken);

    Logger.debug("[ID Token] Decoded", {
      emailVerified,
      phoneNumberVerified,
      currentPath: pathname
    });

    const isVerified = emailVerified && phoneNumberVerified;

    if (!isVerified && pathname !== "/accounts/verify") {
      Logger.debug("[Redirect] Not verified, redirecting to /accounts/verify");
      navigate("/accounts/verify", { replace: true });
    }

    if (isVerified && pathname === "/accounts/verify") {
      Logger.debug("[Redirect] Already verified, redirecting to home");
      navigate("/", { replace: true });
    }
  }, [client, pathname, navigate]);

  return (
    <AuthenticatedProvider initialSession={session}>
      <MainRoot>
        <Header />
        <MainContent>
          <Outlet />
        </MainContent>
      </MainRoot>
    </AuthenticatedProvider>
  );
}

export const MainRoot = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  height: "100%",
  overflow: "hidden"
}));

export const MainContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  backgroundColor: theme.palette.background.default,
  overflow: "hidden"
}));
