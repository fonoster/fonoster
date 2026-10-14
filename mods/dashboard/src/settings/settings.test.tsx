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
import type { Workspace } from "@fonoster/types";
import { screen, within } from "@testing-library/react";
import type { AuthContextValue } from "~/lib/auth";
import { cloudCapabilities } from "~/lib/fixtures";
import type { IdTokenClaims } from "~/lib/jwt";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import SettingsScreen from ".";

// Radix Select needs these in jsdom.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const me = {
  sub: "u1",
  email: "pedro@acme.com",
  accessKeyId: "US1",
  exp: 0
} as IdTokenClaims;

const members = [
  {
    ref: "m1",
    userRef: "u1",
    name: "Pedro Sanders",
    email: "pedro@acme.com",
    role: "WORKSPACE_OWNER",
    status: "ACTIVE"
  },
  {
    ref: "m2",
    userRef: "u2",
    name: "Ana Pérez",
    email: "ana@acme.com",
    role: "WORKSPACE_ADMIN",
    status: "ACTIVE"
  },
  {
    ref: "m3",
    userRef: "u3",
    name: "Carla Díaz",
    email: "carla@acme.com",
    role: "WORKSPACE_MEMBER",
    status: "PENDING"
  }
];

function setup({
  route = "/settings",
  workspace = testWorkspace,
  user = me,
  capabilities
}: {
  route?: string;
  workspace?: Workspace;
  user?: IdTokenClaims;
  capabilities?: typeof cloudCapabilities;
} = {}) {
  const base = fakeAuth({ status: "signedIn", user });
  const workspaces = {
    ...base.sdk.workspaces,
    updateWorkspace: vi.fn().mockResolvedValue({ ref: workspace.ref }),
    deleteWorkspace: vi.fn().mockResolvedValue({ ref: workspace.ref }),
    listWorkspaceMembers: vi.fn().mockResolvedValue({ items: members }),
    inviteUserToWorkspace: vi
      .fn()
      .mockResolvedValue({ workspaceRef: workspace.ref, userRef: "u9" }),
    resendWorkspaceMembershipInvitation: vi
      .fn()
      .mockResolvedValue({ userRef: "u3" }),
    removeUserFromWorkspace: vi.fn().mockResolvedValue({ userRef: "u2" })
  };
  const auth: AuthContextValue = {
    ...base,
    sdk: { ...base.sdk, workspaces } as never
  };
  const view = renderScreen(
    <WorkspaceProvider value={workspace}>
      <SettingsScreen />
    </WorkspaceProvider>,
    { path: "/settings/*", route, auth, capabilities }
  );
  return { ...view, workspaces };
}

describe("Settings · General", () => {
  it("renames the workspace", async () => {
    const { user, workspaces } = setup();
    const name = screen.getByLabelText("Workspace name");
    expect(name).toHaveValue("Acme Support");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.clear(name);
    await user.type(name, "Acme Care");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(workspaces.updateWorkspace).toHaveBeenCalledWith({
      ref: "ws-1",
      name: "Acme Care"
    });
  });

  it("shows the access key ID", () => {
    setup();
    expect(screen.getByLabelText("Access key ID")).toHaveTextContent(
      testWorkspace.accessKeyId
    );
  });

  it("lets the owner delete after typing the workspace name", async () => {
    const { user, workspaces } = setup();
    await user.click(screen.getByRole("button", { name: "Delete workspace" }));
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", {
      name: "Delete workspace"
    });
    expect(confirm).toBeDisabled();
    await user.type(
      within(dialog).getByLabelText('Type "Acme Support" to confirm'),
      "Acme Support"
    );
    await user.click(confirm);
    expect(workspaces.deleteWorkspace).toHaveBeenCalledWith("ws-1");
    expect(await screen.findByTestId("location")).toHaveTextContent("/");
  });

  it("doesn't let other members delete it", () => {
    setup({ workspace: { ...testWorkspace, ownerRef: "someone-else" } });
    expect(
      screen.getByRole("button", { name: "Delete workspace" })
    ).toBeDisabled();
    expect(
      screen.getByText("Only the workspace owner can delete it.")
    ).toBeInTheDocument();
  });
});

describe("Settings · Members", () => {
  it("lists members with their role and status", async () => {
    setup({ route: "/settings/members" });
    expect(
      await screen.findByText("3 members · 1 pending")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "General" })).not.toHaveAttribute(
      "aria-current"
    );
    const table = screen.getByRole("table", { name: "Members" });
    expect(within(table).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(table).getByText("Owner")).toBeInTheDocument();
    expect(within(table).getByText("Invite sent")).toBeInTheDocument();
    expect(
      within(table).queryByRole("button", { name: "Actions for Pedro Sanders" })
    ).not.toBeInTheDocument();
  });

  it("invites a member", async () => {
    const { user, workspaces } = setup({ route: "/settings/members" });
    await user.click(
      await screen.findByRole("button", { name: "Invite member" })
    );
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "Luis Gómez");
    await user.type(within(dialog).getByLabelText("Email"), "luis@acme.com");
    await user.click(within(dialog).getByLabelText("Role"));
    await user.click(await screen.findByRole("option", { name: /Admin/ }));
    await user.click(
      within(dialog).getByRole("button", { name: "Send invite" })
    );
    expect(workspaces.inviteUserToWorkspace).toHaveBeenCalledWith({
      name: "Luis Gómez",
      email: "luis@acme.com",
      role: "WORKSPACE_ADMIN",
      password: ""
    });
  });

  it("validates the invite", async () => {
    const { user, workspaces } = setup({ route: "/settings/members" });
    await user.click(
      await screen.findByRole("button", { name: "Invite member" })
    );
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.click(screen.getByRole("button", { name: "Send invite" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(workspaces.inviteUserToWorkspace).not.toHaveBeenCalled();
  });

  it("resends a pending invite", async () => {
    const { user, workspaces } = setup({ route: "/settings/members" });
    await user.click(
      await screen.findByRole("button", { name: "Actions for Carla Díaz" })
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Resend invite" })
    );
    expect(workspaces.resendWorkspaceMembershipInvitation).toHaveBeenCalledWith(
      "u3"
    );
  });

  it("only offers resend for pending invites, and asks before removing", async () => {
    const { user, workspaces } = setup({ route: "/settings/members" });
    await user.click(
      await screen.findByRole("button", { name: "Actions for Ana Pérez" })
    );
    expect(
      screen.queryByRole("menuitem", { name: "Resend invite" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(workspaces.removeUserFromWorkspace).toHaveBeenCalledWith("u2");
  });
});

describe("Settings · Billing", () => {
  it("hides the tab without billing", () => {
    setup();
    expect(
      screen.queryByRole("link", { name: "Billing" })
    ).not.toBeInTheDocument();
  });

  it("shows the tab and a placeholder with billing", async () => {
    const { user } = setup({ capabilities: cloudCapabilities });
    await user.click(screen.getByRole("link", { name: "Billing" }));
    expect(screen.getByText("Billing moves here soon")).toBeInTheDocument();
  });

  it("sends unknown tabs back to General", async () => {
    setup({ route: "/settings/nope" });
    expect(await screen.findByLabelText("Workspace name")).toBeInTheDocument();
  });

  it("sends /billing back to General without billing", async () => {
    setup({ route: "/settings/billing" });
    expect(await screen.findByLabelText("Workspace name")).toBeInTheDocument();
  });
});
