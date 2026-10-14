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
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "../src/styles/app.css";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import { fn } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { AuthOverride, type AuthContextValue } from "../src/lib/auth";
import { CapabilitiesOverride } from "../src/lib/capabilities";
import type { Capabilities } from "../src/lib/client";
import { cloudCapabilities, communityCapabilities } from "../src/lib/fixtures";
import { RuntimeProvider } from "../src/lib/runtime-context";
import { createFakeAuth } from "../src/test/fake-auth";

export type ScreenParameters = {
  /** Route pattern the story's component is mounted at, and the URL to open. */
  route?: { path?: string; url?: string; state?: unknown };
  /** Overrides the capabilities chosen in the toolbar. */
  capabilities?: Capabilities;
  /** Adjusts the fake session (signed out, with mocked SDK calls, by default). */
  auth?: (auth: AuthContextValue) => Partial<AuthContextValue> | void;
};

/** Providers every screen needs: runtime, query cache, capabilities, session, router. */
const withScreen: Decorator = (Story, context) => {
  const params = (context.parameters.screen ?? {}) as ScreenParameters;
  const capabilities =
    params.capabilities ?? (context.globals.variant === "cloud" ? cloudCapabilities : communityCapabilities);
  const base = createFakeAuth(fn as never);
  const auth = { ...base, ...(params.auth?.(base) ?? {}) };
  const path = params.route?.path ?? "/";
  const url = params.route?.url ?? path;
  const [pathname, search = ""] = url.split("?");
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return (
    <RuntimeProvider value={{ apiUrl: "http://localhost:8449" }}>
      <QueryClientProvider client={queryClient}>
        <CapabilitiesOverride value={capabilities}>
          <AuthOverride value={auth}>
            <TooltipProvider>
              <MemoryRouter initialEntries={[{ pathname, search: search && `?${search}`, state: params.route?.state }]}>
                <Routes>
                  <Route path={path} element={<Story />} />
                  <Route path="*" element={<p className="p-6 text-sm">Navigated away from the story.</p>} />
                </Routes>
              </MemoryRouter>
              <Toaster />
            </TooltipProvider>
          </AuthOverride>
        </CapabilitiesOverride>
      </QueryClientProvider>
    </RuntimeProvider>
  );
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    backgrounds: { disable: true },
    a11y: { test: "error" }
  },
  globalTypes: {
    variant: {
      description: "Deployment capabilities",
      toolbar: {
        title: "Deployment",
        icon: "globe",
        items: [
          { value: "community", title: "Community" },
          { value: "cloud", title: "Cloud" }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: { variant: "community" },
  decorators: [
    withScreen,
    withThemeByDataAttribute({
      themes: { dark: "dark", light: "light" },
      defaultTheme: "dark",
      attributeName: "data-theme"
    })
  ]
};

export default preview;
