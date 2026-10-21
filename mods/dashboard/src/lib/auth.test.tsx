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
import type { DashboardClient } from "./client";
import { GrpcCode } from "./errors";
import { LEGACY_SESSION_KEY } from "./storage";
import { grpcError } from "~/test/render";

function jwt(claims: object) {
  return `x.${btoa(JSON.stringify(claims))}.y`;
}

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

/**
 * A DashboardClient stand-in: sign-ins and refreshes hand out access and id
 * tokens; the refresh token lives "in the cookie", out of the page's reach.
 */
function fakeClient() {
  const tokens = { access: "", id: "" };
  let n = 0;
  const issue = () => {
    n += 1;
    tokens.access = jwt({ exp: inAnHour(), n });
    tokens.id = jwt({ sub: "u1", email: "ada@acme.com", exp: inAnHour() });
  };
  return {
    login: vi.fn(async () => issue()),
    loginWithVerificationCode: vi.fn(async () => issue()),
    loginWithOauth2Code: vi.fn(async () => issue()),
    refreshToken: vi.fn(async () => issue()),
    adoptRefreshToken: vi.fn(async (_token: string) => issue()),
    logout: vi.fn(async () => {
      tokens.access = tokens.id = "";
    }),
    setAccessKeyId: vi.fn(),
    getAccessToken: () => tokens.access,
    getRefreshToken: () => "",
    getIdToken: () => tokens.id
  };
}

function Probe() {
  const { status, user, signInWithPassword, signOut, refreshSession } =
    useAuth();
  const { pathname, search } = useLocation();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="email">{user?.email ?? ""}</p>
      <p data-testid="where">{pathname + search}</p>
      <button onClick={() => void signInWithPassword("ada@acme.com", "pw")}>
        in
      </button>
      <button onClick={() => void refreshSession()}>refresh</button>
      <button onClick={() => signOut()}>out</button>
    </div>
  );
}

function renderProvider(client: ReturnType<typeof fakeClient>, route = "/w/a") {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider client={client as unknown as DashboardClient}>
          <Routes>
            <Route path="*" element={<Probe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const noSession = () =>
  Object.assign(new Error("no session"), { code: GrpcCode.UNAUTHENTICATED });

/** Nothing that looks like a token is in web storage (M4). */
function expectNoTokensStored() {
  for (const store of [localStorage, sessionStorage]) {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i)!;
      const value = store.getItem(key) ?? "";
      expect(key).not.toBe(LEGACY_SESSION_KEY);
      expect(value).not.toMatch(/token|refresh|\w+\.\w+\.\w+/i);
    }
  }
}

const storeLegacySession = () =>
  localStorage.setItem(
    LEGACY_SESSION_KEY,
    JSON.stringify({
      accessToken: jwt({ exp: 1 }),
      refreshToken: "refresh-1",
      idToken: jwt({ email: "old" })
    })
  );

describe("AuthProvider", () => {
  it("asks the cookie session on load and signs out without one", async () => {
    const client = fakeClient();
    client.refreshToken.mockRejectedValue(noSession());
    renderProvider(client);
    expect(screen.getByTestId("status")).toHaveTextContent("restoring");
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedOut")
    );
    expect(client.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("restores the session from the cookie on load", async () => {
    const client = fakeClient();
    renderProvider(client);
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedIn")
    );
    expect(screen.getByTestId("email")).toHaveTextContent("ada@acme.com");
    expect(client.refreshToken).toHaveBeenCalledTimes(1);
    expectNoTokensStored();
  });

  it("signs in without storing any token", async () => {
    const client = fakeClient();
    client.refreshToken.mockRejectedValueOnce(noSession());
    renderProvider(client);
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedOut")
    );
    await act(async () => screen.getByText("in").click());
    expect(screen.getByTestId("status")).toHaveTextContent("signedIn");
    expect(screen.getByTestId("email")).toHaveTextContent("ada@acme.com");
    expectNoTokensStored();

    await act(async () => screen.getByText("refresh").click());
    expect(client.refreshToken).toHaveBeenCalledTimes(2);
    expectNoTokensStored();
  });

  it("moves an older dashboard's stored session into the cookie and deletes it", async () => {
    storeLegacySession();
    const client = fakeClient();
    renderProvider(client);
    expect(localStorage.getItem(LEGACY_SESSION_KEY)).toBeNull();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedIn")
    );
    expect(client.adoptRefreshToken).toHaveBeenCalledWith("refresh-1");
    expect(client.refreshToken).not.toHaveBeenCalled();
    expectNoTokensStored();
  });

  it("falls back to the cookie when the stored session is refused", async () => {
    storeLegacySession();
    const client = fakeClient();
    client.adoptRefreshToken.mockRejectedValue(noSession());
    client.refreshToken.mockRejectedValue(noSession());
    renderProvider(client);
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedOut")
    );
    expect(localStorage.getItem(LEGACY_SESSION_KEY)).toBeNull();
    expect(client.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("signs out and keeps the path when a renewal is refused", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const client = fakeClient();
      renderProvider(client, "/w/a?tab=calls");
      await waitFor(() =>
        expect(screen.getByTestId("status")).toHaveTextContent("signedIn")
      );
      client.refreshToken.mockRejectedValue(
        grpcError(GrpcCode.UNAUTHENTICATED)
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3600_000);
      });
      expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
      expect(screen.getByTestId("where")).toHaveTextContent(
        "/sign-in?next=%2Fw%2Fa%3Ftab%3Dcalls"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the session when a renewal only finds the API unreachable", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const client = fakeClient();
      renderProvider(client);
      await waitFor(() =>
        expect(screen.getByTestId("status")).toHaveTextContent("signedIn")
      );
      client.refreshToken.mockRejectedValue(grpcError(GrpcCode.UNAVAILABLE));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3600_000);
      });
      expect(screen.getByTestId("status")).toHaveTextContent("signedIn");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears everything on sign-out, revokes on the server and goes to a clean sign-in", async () => {
    const client = fakeClient();
    renderProvider(client);
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("signedIn")
    );
    await act(async () => screen.getByText("out").click());
    expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/sign-in$/);
    expect(client.logout).toHaveBeenCalledTimes(1);
    expectNoTokensStored();
  });
});
