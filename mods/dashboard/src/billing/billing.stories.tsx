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
import type { BillingSummary } from "@fonoster/types";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { AuthContextValue } from "~/lib/auth";
import { cloudCapabilities } from "~/lib/fixtures";
import type { IdTokenClaims } from "~/lib/jwt";
import { testWorkspace } from "~/test/workspace";
import BillingPage from ".";

// The approved frames (designs/dashboard.pen, "Billing (cloud only)"), state by state.

const me = {
  sub: "u1",
  email: "pedro@acme.com",
  accessKeyId: "US1",
  exp: 0
} as IdTokenClaims;

const PAYG: BillingSummary = {
  plan: "payg",
  status: "active",
  balance: 1840,
  overdraft: 200,
  sources: [
    { kind: "plan", credits: 1240, expiresAt: "2026-12-04T00:00:00.000Z" },
    { kind: "topup", credits: 600, expiresAt: "2027-09-14T00:00:00.000Z" }
  ],
  periodEnd: "2026-12-01T00:00:00.000Z",
  autoRecharge: false,
  rechargeThreshold: 0,
  rechargeAmount: 0
};

const TRIAL: BillingSummary = {
  ...PAYG,
  plan: "trial",
  balance: 860,
  overdraft: 0,
  sources: [
    { kind: "trial", credits: 860, expiresAt: "2026-11-30T00:00:00.000Z" }
  ],
  periodEnd: ""
};

const owner = (summary: BillingSummary) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  user: me,
  sdk: {
    ...auth.sdk,
    workspaces: {
      ...auth.sdk.workspaces,
      listWorkspaces: fn().mockResolvedValue({ items: [testWorkspace] })
    },
    billing: {
      getBilling: fn().mockResolvedValue(summary),
      createTopUp: fn().mockResolvedValue(summary),
      updateAutoRecharge: fn().mockResolvedValue(summary),
      subscribe: fn().mockResolvedValue(summary),
      createPortalSession: fn().mockResolvedValue({ url: "#" })
    }
  } as never
});

const screen = (summary: BillingSummary) => ({
  screen: {
    route: { path: "/billing", url: "/billing?from=ws-1" },
    capabilities: cloudCapabilities,
    auth: owner(summary)
  }
});

const meta = {
  title: "Account/Billing",
  render: () => <BillingPage />,
  parameters: screen(PAYG)
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PayAsYouGo: Story = {};
export const PayAsYouGoLight: Story = { globals: { theme: "light" } };
export const Trial: Story = { parameters: screen(TRIAL) };
export const TrialEnded: Story = {
  parameters: screen({ ...TRIAL, status: "ended", balance: 0, sources: [] })
};
export const PaymentFailed: Story = {
  parameters: screen({ ...PAYG, status: "past_due" })
};
export const AutoRechargeOn: Story = {
  parameters: screen({
    ...PAYG,
    autoRecharge: true,
    rechargeThreshold: 500,
    rechargeAmount: 2500
  })
};
