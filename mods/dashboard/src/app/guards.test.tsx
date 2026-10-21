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
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthOverride } from "~/lib/auth";
import type { IdTokenClaims } from "~/lib/jwt";
import { fakeAuth } from "~/test/render";
import { PublicOnly, RequireAuth } from "./guards";

function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="where">{pathname + search}</p>;
}

function renderAt(route: string, auth = fakeAuth()) {
  render(
    <AuthOverride value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/workspaces" element={<Where />} />
            <Route path="/set-password" element={<Where />} />
            <Route path="/" element={<Where />} />
          </Route>
          <Route element={<PublicOnly />}>
            <Route path="/sign-in" element={<Where />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthOverride>
  );
  return screen.getByTestId("where").textContent;
}

const user = (claims: Partial<IdTokenClaims> = {}) =>
  ({
    sub: "u1",
    email: "ada@acme.com",
    accessKeyId: "US1",
    exp: 0,
    ...claims
  }) as IdTokenClaims;

describe("route guards", () => {
  it("sends a signed-out visitor to sign-in, keeping the path", () => {
    expect(renderAt("/workspaces")).toBe("/sign-in?next=%2Fworkspaces");
  });

  it("drops next after the user signed out on purpose", () => {
    expect(renderAt("/workspaces", fakeAuth({ endedBy: "user" }))).toBe(
      "/sign-in"
    );
  });

  it("holds an invitee on Set password until they change it", () => {
    const auth = fakeAuth({
      status: "signedIn",
      user: user({ mustChangePassword: true })
    });
    expect(renderAt("/workspaces", auth)).toBe("/set-password");
  });

  it("leaves Set password once the flag is gone", () => {
    const auth = fakeAuth({ status: "signedIn", user: user() });
    expect(renderAt("/set-password", auth)).toBe("/");
  });

  it("sends a signed-in user away from sign-in", () => {
    const auth = fakeAuth({ status: "signedIn", user: user() });
    expect(renderAt("/sign-in", auth)).toBe("/");
  });

  it("returns a signed-in user to next when it is a path on this origin", () => {
    const auth = fakeAuth({ status: "signedIn", user: user() });
    expect(renderAt("/sign-in?next=%2Fworkspaces", auth)).toBe("/workspaces");
  });

  it("ignores a next that is a URL", () => {
    const auth = fakeAuth({ status: "signedIn", user: user() });
    expect(renderAt("/sign-in?next=https%3A%2F%2Fevil.example", auth)).toBe(
      "/"
    );
  });

  it("ignores a protocol-relative next", () => {
    const auth = fakeAuth({ status: "signedIn", user: user() });
    expect(renderAt("/sign-in?next=%2F%2Fevil.example", auth)).toBe("/");
  });
});
