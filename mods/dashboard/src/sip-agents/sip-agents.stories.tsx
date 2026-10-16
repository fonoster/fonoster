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
import SipAgentsScreen from ".";

const acme = { ref: "dm-1", name: "Acme HQ", domainUri: "acme.fonoster.local" };
const madrid = {
  ref: "dm-2",
  name: "Madrid office",
  domainUri: "madrid.acme.fonoster.local"
};

const sample = [
  ["ag-1", "María Rodríguez", "maria", acme, "NONE", 3, true],
  ["ag-2", "Front desk phone", "desk", acme, "NONE", 1, true],
  ["ag-3", "Lucía Martín", "lucia", madrid, "PRIVATE", 2, true],
  ["ag-4", "Old softphone", "test", acme, "NONE", 1, false]
].map(([ref, name, username, domain, privacy, maxContacts, enabled]) => ({
  ref,
  name,
  username,
  domain,
  privacy,
  maxContacts,
  enabled,
  expires: 3600
}));

const withSipAgents = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    agents: {
      listAgents: fn().mockResolvedValue({ items }),
      createAgent: fn().mockResolvedValue({ ref: "ag-new" }),
      updateAgent: fn().mockResolvedValue({ ref: "ag-1" }),
      deleteAgent: fn().mockResolvedValue({ ref: "ag-1" })
    },
    domains: { listDomains: fn().mockResolvedValue({ items: [acme, madrid] }) },
    credentials: {
      listCredentials: fn().mockResolvedValue({
        items: [{ ref: "cr-1", name: "Maria's phone", username: "maria" }]
      })
    }
  } as never
});

const meta = {
  title: "SIP network/SIP agents",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <SipAgentsScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withSipAgents(sample) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withSipAgents([]) } }
};
