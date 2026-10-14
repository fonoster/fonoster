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
import type { AuthContextValue } from "~/lib/auth";
import type { IdTokenClaims } from "~/lib/jwt";
import CreateWorkspacePage from "./create-workspace.page";
import WorkspacesPage from "./landing.page";

const me = {
  sub: "u1",
  email: "pedro@acme.com",
  accessKeyId: "US1",
  exp: 0
} as IdTokenClaims;

const workspaces = [
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
    createdAt: new Date("2026-06-18"),
    owner: { ref: "u2", name: "Maria Lopez", email: "maria@acme.com" }
  },
  {
    ref: "c",
    name: "Fonoster Labs",
    ownerRef: "u3",
    accessKeyId: "WOc",
    createdAt: new Date("2026-09-02"),
    owner: { ref: "u3", name: "Ana Ruiz", email: "ana@acme.com" }
  }
];

type Mocked = { mockResolvedValue(v: unknown): void };

const signedIn = (items: object[]) => (auth: AuthContextValue) => {
  (auth.sdk.workspaces.listWorkspaces as unknown as Mocked).mockResolvedValue({
    items
  });
  (auth.sdk.users.getUser as unknown as Mocked).mockResolvedValue({
    ref: "u1",
    name: "Pedro Sanders",
    email: "pedro@acme.com"
  });
  return { status: "signedIn" as const, user: me };
};

const meta = {
  title: "Workspaces/Landing",
  parameters: { screen: { route: { path: "/" } } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Select: Story = {
  render: () => <WorkspacesPage />,
  parameters: { screen: { route: { path: "/" }, auth: signedIn(workspaces) } }
};

export const SelectLight: Story = { ...Select, globals: { theme: "light" } };

export const CreateFirst: Story = {
  render: () => <CreateWorkspacePage />,
  parameters: { screen: { route: { path: "/" }, auth: signedIn([]) } }
};

export const CreateAnother: Story = {
  render: () => <CreateWorkspacePage />,
  parameters: { screen: { route: { path: "/" }, auth: signedIn(workspaces) } }
};
