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
import { fn } from "@storybook/test";
import type { AuthContextValue } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { testWorkspace } from "~/test/workspace";
import CredentialsScreen from ".";
import { CredentialsDrawer } from "./credentials-drawer";

const sample = [
  { ref: "cr-2b0f17", name: "claro-acme", username: "acme" },
  { ref: "cr-91ad40", name: "altice-acme", username: "acme_do" },
  { ref: "cr-c0ee5b", name: "maria-desk", username: "maria" },
  { ref: "cr-4f81d2", name: "lucia-desk", username: "lucia" }
];

const trunks = [
  { ref: "t1", name: "Claro", outboundCredentials: { ref: "cr-2b0f17" } },
  { ref: "t2", name: "Altice", inboundCredentials: { ref: "cr-91ad40" } }
];

const agents = [
  { ref: "a1", name: "María Rodríguez", credentials: { ref: "cr-c0ee5b" } },
  { ref: "a2", name: "Lucía Martín", credentials: { ref: "cr-4f81d2" } }
];

const withCredentials = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    credentials: {
      listCredentials: fn().mockResolvedValue({ items }),
      createCredentials: fn().mockResolvedValue({ ref: "cr-new" }),
      updateCredentials: fn().mockResolvedValue({ ref: "cr-2b0f17" }),
      deleteCredentials: fn().mockResolvedValue(undefined)
    },
    trunks: { listTrunks: fn().mockResolvedValue({ items: trunks }) },
    agents: { listAgents: fn().mockResolvedValue({ items: agents }) }
  } as never
});

const meta = {
  title: "SIP Network/Credentials",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <CredentialsScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withCredentials(sample) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withCredentials([]) } }
};

export const Edit: Story = {
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <CredentialsDrawer
        open
        onOpenChange={() => {}}
        credentials={sample[0] as never}
        usedBy={["Trunk · Claro (outbound)"]}
        onDelete={() => {}}
      />
    </WorkspaceProvider>
  )
};
export const EditLight: Story = { ...Edit, globals: { theme: "light" } };
