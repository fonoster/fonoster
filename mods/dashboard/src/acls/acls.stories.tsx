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
import AclsScreen from ".";
import { AclDrawer } from "./acl-drawer";

const sample = [
  {
    ref: "acl-55e1a9",
    name: "Claro signaling IPs",
    allow: ["190.80.12.0/24", "190.80.13.4/32"]
  },
  { ref: "acl-0a7c3e", name: "Office network", allow: ["10.0.0.0/16"] },
  {
    ref: "acl-e3b904",
    name: "Telnyx EU",
    allow: [
      "185.246.41.140/32",
      "185.246.41.141/32",
      "185.246.41.142/32",
      "185.246.41.143/32"
    ]
  },
  {
    ref: "acl-77f201",
    name: "Twilio",
    allow: [
      "54.172.60.0/30",
      "54.244.51.0/30",
      "54.171.127.192/30",
      "35.156.191.128/30",
      "54.65.63.192/30",
      "54.169.127.128/30",
      "54.252.254.64/30",
      "177.71.206.192/30"
    ]
  }
];

const trunks = [
  { ref: "t1", name: "Claro", accessControlList: { ref: "acl-55e1a9" } },
  { ref: "t2", name: "Telnyx EU", accessControlList: { ref: "acl-e3b904" } },
  { ref: "t3", name: "Twilio", accessControlList: { ref: "acl-77f201" } }
];

const domains = [
  { ref: "d1", name: "Acme HQ", accessControlList: { ref: "acl-0a7c3e" } }
];

const withAcls = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    acls: {
      listAcls: fn().mockResolvedValue({ items }),
      createAcl: fn().mockResolvedValue({ ref: "acl-new" }),
      updateAcl: fn().mockResolvedValue({ ref: "acl-55e1a9" }),
      deleteAcl: fn().mockResolvedValue(undefined)
    },
    trunks: { listTrunks: fn().mockResolvedValue({ items: trunks }) },
    domains: { listDomains: fn().mockResolvedValue({ items: domains }) }
  } as never
});

const meta = {
  title: "SIP Network/ACLs",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <AclsScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withAcls(sample) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withAcls([]) } }
};

export const Edit: Story = {
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <AclDrawer
        open
        onOpenChange={() => {}}
        acl={sample[0] as never}
        usedBy={["Trunk · Claro"]}
        onDelete={() => {}}
      />
    </WorkspaceProvider>
  )
};
export const EditLight: Story = { ...Edit, globals: { theme: "light" } };
