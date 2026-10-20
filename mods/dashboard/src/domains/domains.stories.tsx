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
import DomainsScreen from ".";

const sampleDomains = [
  {
    ref: "dm-1f02aa",
    name: "Acme HQ",
    domainUri: "acme.sip.fonoster.local",
    accessControlList: { ref: "acl-1", name: "Office network" },
    egressPolicies: [{ rule: ".*", numberRef: "nb-1" }]
  },
  {
    ref: "dm-8c41d0",
    name: "Madrid office",
    domainUri: "madrid.sip.fonoster.local",
    egressPolicies: [{ rule: "^\\+34", numberRef: "nb-2" }]
  }
];

const withDomains = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    domains: {
      listDomains: fn().mockResolvedValue({ items }),
      createDomain: fn().mockResolvedValue({ ref: "dm-new" }),
      updateDomain: fn().mockResolvedValue({ ref: "dm-1f02aa" }),
      deleteDomain: fn().mockResolvedValue({ ref: "dm-1f02aa" })
    },
    acls: {
      listAcls: fn().mockResolvedValue({
        items: [
          { ref: "acl-1", name: "Office network" },
          { ref: "acl-2", name: "Madrid office" }
        ]
      })
    },
    numbers: {
      listNumbers: fn().mockResolvedValue({
        items: [
          { ref: "nb-1", name: "Main line", telUrl: "tel:+18095550100" },
          { ref: "nb-2", name: "Madrid", telUrl: "tel:+34910555210" }
        ]
      })
    }
  } as never
});

const meta = {
  title: "SIP network/Domains",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <DomainsScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withDomains(sampleDomains) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withDomains([]) } }
};
