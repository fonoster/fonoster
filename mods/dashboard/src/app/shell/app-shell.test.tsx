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
    localStorage.setItem("fonoster.nav", "expanded");
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

  it("starts collapsed to a rail when there is no saved preference", async () => {
    const { user } = renderShell();
    expect(
      screen.getByRole("button", { name: "Expand sidebar" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("SIP network")).not.toBeInTheDocument();
    // Regression: the tooltip wrapper used to stringify NavLink's className function.
    expect(screen.getByRole("link", { name: "Numbers" })).toHaveClass(
      "size-10"
    );
    expect(screen.getByRole("link", { name: "Secrets" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    // Icons keep their labels as tooltips.
    await user.hover(screen.getByRole("link", { name: "Numbers" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Numbers");
  });

  it("remembers when the user expands and collapses it", async () => {
    const { user, unmount } = renderShell();
    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByRole("navigation")).toHaveTextContent("SIP network");
    expect(localStorage.getItem("fonoster.nav")).toBe("expanded");
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.queryByText("SIP network")).not.toBeInTheDocument();
    expect(localStorage.getItem("fonoster.nav")).toBe("collapsed");
    unmount();
    renderShell();
    expect(
      screen.getByRole("button", { name: "Expand sidebar" })
    ).toBeInTheDocument();
  });

  it("honors a saved expanded preference", () => {
    localStorage.setItem("fonoster.nav", "expanded");
    renderShell();
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation")).toHaveTextContent("SIP network");
  });
});
