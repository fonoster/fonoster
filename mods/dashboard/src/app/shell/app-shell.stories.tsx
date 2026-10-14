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
import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import type { AuthContextValue } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { testWorkspace } from "~/test/workspace";
import { AppShell } from "./app-shell";
import { PendingScreen } from "./page";

type Mocked = { mockResolvedValue(v: unknown): void };

const signedIn = (auth: AuthContextValue) => {
  (auth.sdk.workspaces.listWorkspaces as unknown as Mocked).mockResolvedValue({
    items: [
      testWorkspace,
      { ...testWorkspace, ref: "ws-2", name: "Acme Sales", ownerRef: "u2" }
    ]
  });
  (auth.sdk.users.getUser as unknown as Mocked).mockResolvedValue({
    ref: "u1",
    name: "Pedro Sanders",
    email: "pedro@acme.com"
  });
  return {
    status: "signedIn" as const,
    user: { sub: "u1", email: "pedro@acme.com", accessKeyId: "US1", exp: 0 }
  };
};

function Shell() {
  return (
    <WorkspaceProvider value={testWorkspace}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<PendingScreen title="Secrets" />} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  );
}

const meta = {
  title: "App/Shell",
  render: () => <Shell />,
  parameters: {
    screen: {
      route: { path: "/w/:workspaceRef/*", url: "/w/ws-1/secrets" },
      auth: signedIn
    }
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  beforeEach: () => {
    localStorage.removeItem("fonoster.nav");
  }
};

export const Collapsed: Story = {
  beforeEach: () => {
    localStorage.setItem("fonoster.nav", "collapsed");
    return () => localStorage.removeItem("fonoster.nav");
  }
};

export const Light: Story = { ...Expanded, globals: { theme: "light" } };
