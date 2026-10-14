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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { vi } from "vitest";
import { AuthOverride, type AuthContextValue } from "~/lib/auth";
import { CapabilitiesOverride } from "~/lib/capabilities";
import type { Capabilities } from "~/lib/client";
import { communityCapabilities } from "~/lib/fixtures";
import { RuntimeProvider } from "~/lib/runtime-context";
import { createFakeAuth } from "./fake-auth";

export { grpcError } from "./fake-auth";

/** A signed-out session whose SDK calls are all vi.fn mocks. */
export function fakeAuth(
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue {
  return createFakeAuth(() => vi.fn() as never, overrides);
}

/**
 * Renders a screen at `path` with fixed capabilities and a fake session.
 * Other routes render a marker so tests can assert where navigation went.
 */
export function renderScreen(
  element: ReactElement,
  {
    path = "/",
    route = path,
    state,
    capabilities = communityCapabilities,
    auth = fakeAuth()
  }: {
    path?: string;
    route?: string;
    state?: unknown;
    capabilities?: Capabilities;
    auth?: AuthContextValue;
  } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const user = userEvent.setup();
  const view = render(
    <RuntimeProvider value={{ apiUrl: "http://api.test" }}>
      <QueryClientProvider client={queryClient}>
        <CapabilitiesOverride value={capabilities}>
          <AuthOverride value={auth}>
            <MemoryRouter
              initialEntries={[
                {
                  pathname: route.split("?")[0],
                  search: route.includes("?") ? `?${route.split("?")[1]}` : "",
                  state
                }
              ]}
            >
              <Routes>
                <Route path={path} element={element} />
                <Route path="*" element={<LocationMarker />} />
              </Routes>
            </MemoryRouter>
          </AuthOverride>
        </CapabilitiesOverride>
      </QueryClientProvider>
    </RuntimeProvider>
  );
  return { ...view, user, auth };
}

function LocationMarker() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{pathname + search}</div>;
}
