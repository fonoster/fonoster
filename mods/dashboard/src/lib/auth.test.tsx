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
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import type { WebClient } from "./client";
import { GrpcCode } from "./errors";
import { STORAGE_KEYS } from "./storage";
import { grpcError } from "~/test/render";

function jwt(claims: object) {
  return `x.${btoa(JSON.stringify(claims))}.y`;
}

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

/** A WebClient stand-in that hands out tokens like the SDK does. */
function fakeClient() {
  const tokens = { access: "", refresh: "", id: "" };
  const issue = () => {
    tokens.access = jwt({ exp: inAnHour() });
    tokens.refresh = "refresh-2";
    tokens.id = jwt({ sub: "u1", email: "ada@acme.com", exp: inAnHour() });
  };
  return {
    login: vi.fn(async () => issue()),
    loginWithRefreshToken: vi.fn(async () => issue()),
    logout: vi.fn(),
    setAccessKeyId: vi.fn(),
    setAccessToken: vi.fn(),
    getAccessToken: () => tokens.access,
    getRefreshToken: () => tokens.refresh,
    getIdToken: () => tokens.id
  };
}

function Probe() {
  const { status, user, signInWithPassword, signOut } = useAuth();
  const { pathname, search } = useLocation();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="email">{user?.email ?? ""}</p>
      <p data-testid="where">{pathname + search}</p>
      <button onClick={() => void signInWithPassword("ada@acme.com", "pw")}>
        in
      </button>
      <button onClick={() => signOut()}>out</button>
    </div>
  );
}

function renderProvider(client: ReturnType<typeof fakeClient>, route = "/w/a") {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider client={client as unknown as WebClient}>
          <Routes>
            <Route path="*" element={<Probe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const storeSession = () =>
  localStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify({
      accessToken: jwt({ exp: 1 }),
      refreshToken: "refresh-1",
      idToken: jwt({ email: "old" })
    })
  );

describe("AuthProvider", () => {
  it("starts signed out with nothing stored", () => {
    renderProvider(fakeClient());
    expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
  });

  it("stores the session after signing in", async () => {
    const client = fakeClient();
    renderProvider(client);
    await act(async () => screen.getByText("in").click());
    expect(screen.getByTestId("status")).toHaveTextContent("signedIn");
    expect(screen.getByTestId("email")).toHaveTextContent("ada@acme.com");
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.session)!).refreshToken
    ).toBe("refresh-2");
  });

  it("renews a stored session on load", async () => {
    storeSession();
    const client = fakeClient();
    renderProvider(client);
    expect(screen.getByTestId("status")).toHaveTextContent("restoring");
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedIn")
    );
    expect(client.loginWithRefreshToken).toHaveBeenCalledWith("refresh-1");
  });

  it("signs out and keeps the path when the refresh token is refused", async () => {
    storeSession();
    const client = fakeClient();
    client.loginWithRefreshToken.mockRejectedValue(
      grpcError(GrpcCode.UNAUTHENTICATED)
    );
    renderProvider(client, "/w/a?tab=calls");
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedOut")
    );
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
    expect(screen.getByTestId("where")).toHaveTextContent(
      "/sign-in?next=%2Fw%2Fa%3Ftab%3Dcalls"
    );
  });

  it("keeps the session when the API is only unreachable", async () => {
    storeSession();
    const client = fakeClient();
    client.loginWithRefreshToken.mockRejectedValue(
      grpcError(GrpcCode.UNAVAILABLE)
    );
    renderProvider(client);
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedIn")
    );
    expect(localStorage.getItem(STORAGE_KEYS.session)).not.toBeNull();
  });

  it("clears everything on sign-out and goes to a clean sign-in", async () => {
    localStorage.setItem(STORAGE_KEYS.workspace, "a");
    const client = fakeClient();
    renderProvider(client);
    await act(async () => screen.getByText("in").click());
    await act(async () => screen.getByText("out").click());
    expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/sign-in$/);
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.workspace)).toBeNull();
    expect(client.logout).toHaveBeenCalled();
  });
});
