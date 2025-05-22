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
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "react-router";
import stylesheet from "./app.css?url";
import type { Route } from "./+types/root";
import type React from "react";
import { Providers } from "./core/providers/providers";
import { metadata } from "./core/helpers/metadata";
import { ErrorLayout } from "./core/components/general/error-boundary/error-boundary";
import { Splash } from "./core/components/general/splash/splash";

import { SessionProvider } from "./auth/stores/session.store";

/**
 * Links
 *
 * This function is used to add links to the head of the document.
 * In this case, we are adding a preconnect link to the Google Fonts API
 * and a stylesheet link to the Google Fonts stylesheet.
 */
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..700&display=swap"
  },
  { rel: "stylesheet", href: stylesheet }
];

/**
 * Meta
 *
 * This function is used to add meta tags to the head of the document.
 * In this case, we are adding a title and description meta tag.
 */
export function meta() {
  return metadata();
}

/**
 * This function is used to prevent the app from revalidating data
 * on every navigation. This is useful for performance reasons
 * and to avoid unnecessary network requests.
 *
 * @see https://reactrouter.com/start/framework/route-module#shouldrevalidate
 */
export const shouldRevalidate = () => false;

/**
 * Initialize Auth
 *
 * This function is used to initialize the authentication
 * for the app. It is called when the app is loaded.
 * In this case, we are using the rootAuthLoader function
 * from the auth module to initialize the authentication.
 */
export { rootAuthLoader as loader } from "./auth/services/auth.loader.server";

/**
 * Hydrate Fallback
 *
 * This function is used to render a fallback component
 * while the app is hydrating. This is useful for performance reasons
 * and to avoid unnecessary network requests.
 * In this case, we are rendering a splash screen
 * while the app is hydrating.
 */
export function HydrateFallback() {
  return <Splash />;
}

/**
 * Layout
 *
 * This function is used to render the layout of the app.
 * It is called when the app is loaded.
 * In this case, we are rendering the head, body and scripts
 * of the app. We are also using the Providers component
 * to wrap the children of the app.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google" content="notranslate" />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * App
 *
 * This function is used to render the app.
 * It is called when the app is loaded.
 * In this case, we are rendering the Outlet component
 * which is used to render the child routes of the app.
 */
export default function App({ loaderData: { session } }: Route.ComponentProps) {
  return (
    <SessionProvider initialSession={session}>
      <Outlet />
    </SessionProvider>
  );
}

/**
 * Error Boundary
 *
 * This function is used to render the error boundary of the app.
 * It is called when an error occurs in the app.
 * In this case, we are rendering the ErrorLayout component
 * which is used to render the error page of the app.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const code = isRouteErrorResponse(error) ? error.status : 500;

  return <ErrorLayout errorCode={code} />;
}
