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
import type { IdTokenClaims } from "~/lib/jwt";
import { fakeAuth, renderScreen } from "~/test/render";
import CreateWorkspacePage from "./create-workspace.page";
import WorkspacesPage from "./landing.page";

const me = {
  sub: "u1",
  email: "ada@acme.com",
  accessKeyId: "US1",
  exp: 0
} as IdTokenClaims;

function withWorkspaces(items: object[]) {
  const auth = fakeAuth({ status: "signedIn", user: me });
  vi.mocked(auth.sdk.workspaces.listWorkspaces).mockResolvedValue({
    items
  } as never);
  return auth;
}

describe("workspace landing", () => {
  it("lists workspaces, marking the ones the user owns", async () => {
    const auth = withWorkspaces([
      {
        ref: "a",
        name: "Acme Support",
        ownerRef: "u1",
        accessKeyId: "WOa",
        createdAt: new Date("2026-03-04")
      },
      {
        ref: "b",
        name: "Acme Sales",
        ownerRef: "u2",
        accessKeyId: "WOb",
        owner: { name: "Maria Lopez" }
      }
    ]);
    renderScreen(<WorkspacesPage />, { path: "/workspaces", auth });
    expect(await screen.findByText("Acme Support")).toBeInTheDocument();
    expect(screen.getByText(/Owned by you/)).toBeInTheDocument();
    expect(screen.getByText(/Owned by Maria Lopez/)).toBeInTheDocument();
    expect(screen.getAllByText("Owner")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Acme Sales/ })).toHaveAttribute(
      "href",
      "/w/b"
    );
  });

  it("goes to Create workspace when there are none", async () => {
    renderScreen(<WorkspacesPage />, {
      path: "/workspaces",
      auth: withWorkspaces([])
    });
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspaces/new"
    );
  });

  it("creates the first workspace and opens it", async () => {
    const auth = withWorkspaces([]);
    const { user } = renderScreen(<CreateWorkspacePage />, {
      path: "/workspaces/new",
      auth
    });
    expect(
      await screen.findByRole("heading", { name: "Welcome, Ada" })
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Workspace name"), "Acme Support");
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    expect(auth.sdk.workspaces.createWorkspace).toHaveBeenCalledWith({
      name: "Acme Support",
      region: "us-east-1"
    });
    expect(await screen.findByTestId("location")).toHaveTextContent("/w/ws1");
    expect(localStorage.getItem("fonoster.workspace")).toBe("ws1");
  });
});
