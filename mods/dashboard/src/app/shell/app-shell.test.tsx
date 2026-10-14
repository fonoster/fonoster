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
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { AppShell } from "./app-shell";

function renderShell() {
  const auth = fakeAuth({
    status: "signedIn",
    user: { sub: "u1", email: "ada@acme.com", accessKeyId: "US1", exp: 0 }
  });
  vi.mocked(auth.sdk.workspaces.listWorkspaces).mockResolvedValue({
    items: [testWorkspace]
  } as never);
  return renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<p>page</p>} />
        </Route>
      </Routes>
    </WorkspaceProvider>,
    { path: "/w/:workspaceRef/*", route: "/w/ws-1/secrets", auth }
  );
}

describe("AppShell", () => {
  it("shows the navigation with the current page active", () => {
    renderShell();
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveTextContent("SIP network");
    expect(screen.getByRole("link", { name: "Secrets" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(
      screen.getByRole("button", { name: /Workspace: Acme Support/ })
    ).toBeInTheDocument();
  });

  it("collapses to a rail and remembers it", async () => {
    const { user } = renderShell();
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(
      screen.getByRole("button", { name: "Expand sidebar" })
    ).toBeInTheDocument();
    expect(screen.queryByText("SIP network")).not.toBeInTheDocument();
    // Regression: the tooltip wrapper used to stringify NavLink's className function.
    expect(screen.getByRole("link", { name: "Numbers" })).toHaveClass(
      "size-10"
    );
    expect(screen.getByRole("link", { name: "Secrets" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(localStorage.getItem("fonoster.nav")).toBe("collapsed");
  });
});
