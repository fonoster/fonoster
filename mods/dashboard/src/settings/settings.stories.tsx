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
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { AuthContextValue } from "~/lib/auth";
import { cloudCapabilities } from "~/lib/fixtures";
import type { IdTokenClaims } from "~/lib/jwt";
import { WorkspaceProvider } from "~/lib/workspace";
import { testWorkspace } from "~/test/workspace";
import SettingsScreen from ".";

const me = {
  sub: "u1",
  email: "pedro@acme.com",
  accessKeyId: "US1",
  exp: 0
} as IdTokenClaims;

const workspace: Workspace = {
  ...testWorkspace,
  accessKeyId: "WOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  owner: { ref: "u1", name: "Pedro Sanders", email: "pedro@acme.com" }
};

const members = [
  ["m1", "u1", "Pedro Sanders", "pedro@acme.com", "WORKSPACE_OWNER", "ACTIVE"],
  ["m2", "u2", "Ana Pérez", "ana@acme.com", "WORKSPACE_ADMIN", "ACTIVE"],
  ["m3", "u3", "Luis Gómez", "luis@acme.com", "WORKSPACE_MEMBER", "ACTIVE"],
  ["m4", "u4", "Carla Díaz", "carla@acme.com", "WORKSPACE_MEMBER", "PENDING"]
].map(([ref, userRef, name, email, role, status]) => ({
  ref,
  userRef,
  name,
  email,
  role,
  status
}));

const signedIn = (user: IdTokenClaims) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  user,
  sdk: {
    ...auth.sdk,
    workspaces: {
      ...auth.sdk.workspaces,
      updateWorkspace: fn().mockResolvedValue({ ref: workspace.ref }),
      deleteWorkspace: fn().mockResolvedValue({ ref: workspace.ref }),
      listWorkspaceMembers: fn().mockResolvedValue({ items: members }),
      inviteUserToWorkspace: fn().mockResolvedValue({ userRef: "u9" }),
      resendWorkspaceMembershipInvitation: fn().mockResolvedValue({}),
      removeUserFromWorkspace: fn().mockResolvedValue({})
    }
  } as never
});

const at = (url: string) => ({ path: "/settings/*", url });

const meta = {
  title: "Workspace/Settings",
  render: () => (
    <WorkspaceProvider value={workspace}>
      <SettingsScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { route: at("/settings"), auth: signedIn(me) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const General: Story = {};
export const GeneralLight: Story = { globals: { theme: "light" } };

/** A member who isn't the owner can't delete the workspace. */
export const GeneralNotOwner: Story = {
  parameters: {
    screen: {
      route: at("/settings"),
      auth: signedIn({ ...me, sub: "u2", email: "ana@acme.com" })
    }
  }
};

export const Members: Story = {
  parameters: { screen: { route: at("/settings/members"), auth: signedIn(me) } }
};
export const MembersLight: Story = {
  ...Members,
  globals: { theme: "light" }
};

/** Fonoster Cloud shows the Billing tab (its content comes later). */
export const BillingCloud: Story = {
  parameters: {
    screen: {
      route: at("/settings/billing"),
      auth: signedIn(me),
      capabilities: cloudCapabilities
    }
  }
};
export const GeneralCloud: Story = {
  parameters: {
    screen: {
      route: at("/settings"),
      auth: signedIn(me),
      capabilities: cloudCapabilities
    }
  }
};
