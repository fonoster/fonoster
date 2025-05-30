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
import { Outlet } from "react-router";
import type { Route } from "./+types/authenticated.layout";
import { getRequiredSession } from "~/auth/services/sessions/session.server";
import { Box, styled } from "@mui/material";
import { Header } from "../general/header/header";
import { AuthenticatedProvider } from "~/auth/stores/authenticated.store";

/**
 * This hook determines whether the route should revalidate.
 * Since authenticated routes don't need to revalidate on navigation,
 * we return false to improve performance.
 */
export const shouldRevalidate = () => true;

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
export default function AuthenticatedLayout() {
  return (
    <AuthenticatedProvider>
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
