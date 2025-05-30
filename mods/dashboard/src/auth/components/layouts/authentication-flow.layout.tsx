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
import { Box, styled } from "@mui/material";
import { Outlet } from "react-router";
import { AuthenticationFlowHeader as LayoutHeader } from "./authentication-flow.header";
import type { Route } from "./+types/authentication-flow.layout";
import { getUnauthenticatedSession } from "~/auth/services/sessions/session.server";

/**
 * Prevents route revalidation on navigation.
 *
 * Since authentication-related routes typically don't require revalidation
 * unless a form is submitted or a redirect occurs, we disable automatic
 * revalidation for performance.
 */
export const shouldRevalidate = () => true;

/**
 * Route loader for authentication flow (e.g., login, register, etc).
 *
 * Ensures that only unauthenticated users can access this layout.
 * If the user is already authenticated, it redirects them to the root ("/"),
 * preventing access to login/signup pages while logged in.
 *
 * @param request - The HTTP request object containing cookies
 * @returns null if user is not authenticated; otherwise redirects
 */
export async function loader({ request }: Route.LoaderArgs) {
  return await getUnauthenticatedSession(request.headers.get("Cookie"));
}

/**
 * Layout component for all authentication-related routes.
 *
 * This layout typically wraps routes like `/login`, `/signup`, `/forgot-password`, etc.
 * It includes a header and centers its children within a styled container.
 *
 * Note: Authenticated users are redirected away from this layout via the loader.
 */
export default function AuthenticationFlowLayout() {
  return (
    <LayoutRoot>
      {/* Header with app branding or navigation (minimal) */}
      <LayoutHeader />

      {/* Content area where authentication routes are rendered */}
      <LayoutContent>
        <Outlet />
      </LayoutContent>
    </LayoutRoot>
  );
}

/**
 * Root layout container using Material UI's Box component.
 * Vertically centers the content and ensures full viewport height.
 */
export const LayoutRoot = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  height: "100%",
  overflow: "auto"
}));

/**
 * Inner layout content area for the authentication form and related UI.
 * Uses padding for spacing, and fills available vertical space.
 */
export const LayoutContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 40px",
  backgroundColor: theme.palette.background.default,
  flexGrow: 1
}));
