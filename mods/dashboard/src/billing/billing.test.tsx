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
import type { BillingSummary, Workspace } from "@fonoster/types";
import { screen, waitFor, within } from "@testing-library/react";
import { UserMenu } from "~/app/shell/user-menu";
import type { IdTokenClaims } from "~/lib/jwt";
import { cloudCapabilities, communityCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import BillingPage from ".";

// add-billing-page: the Billing page and its account-menu item (dashboard "Cloud-only screens
// follow capabilities and ownership", "Owners manage billing from the Billing page").

const me = {
  sub: "u1",
  email: "pedro@acme.com",
  accessKeyId: "US1",
  exp: 0
} as IdTokenClaims;
const theirs: Workspace = {
  ...testWorkspace,
  ref: "ws-2",
  name: "Acme Sales",
  ownerRef: "u2"
};

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

function sdkWith(
  summary: BillingSummary,
  workspaces: Workspace[] = [testWorkspace]
) {
  const billing = {
    getBilling: vi.fn().mockResolvedValue(summary),
    createTopUp: vi.fn().mockResolvedValue(summary),
    updateAutoRecharge: vi.fn().mockResolvedValue(summary),
    subscribe: vi.fn().mockResolvedValue(summary),
    createPortalSession: vi
      .fn()
      .mockResolvedValue({ url: "https://billing.stripe.com/p/test" })
  };
  const sdk = {
    billing,
    users: {
      getUser: vi.fn().mockResolvedValue({ ref: "u1", name: "Pedro Sanders" })
    },
    workspaces: {
      listWorkspaces: vi.fn().mockResolvedValue({ items: workspaces })
    }
  };
  return {
    billing,
    auth: fakeAuth({ status: "signedIn", user: me, sdk: sdk as never })
  };
}

function page(
  summary: BillingSummary,
  {
    capabilities = cloudCapabilities,
    workspaces = [testWorkspace],
    route = "/billing?from=ws-1"
  } = {}
) {
  const { billing, auth } = sdkWith(summary, workspaces);
  return {
    billing,
    ...renderScreen(<BillingPage />, {
      path: "/billing",
      route,
      capabilities,
      auth
    })
  };
}

function menu(workspace: Workspace, capabilities = cloudCapabilities) {
  const { billing, auth } = sdkWith(PAYG, [testWorkspace, theirs]);
  const view = renderScreen(
    <WorkspaceProvider value={workspace}>
      <UserMenu collapsed={false} />
    </WorkspaceProvider>,
    { capabilities, auth }
  );
  return { billing, ...view };
}

const location = vi.fn();
beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { href: "http://app.test/billing?from=ws-1", assign: location }
  });
});

describe("Billing availability", () => {
  it("has no Billing without billing.enabled", async () => {
    page(PAYG, { capabilities: communityCapabilities });
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspaces"
    );
  });

  it("has no Billing for a user who owns no workspace", async () => {
    page(PAYG, { workspaces: [theirs], route: "/billing" });
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspaces"
    );
  });

  it("puts Billing, with the balance, in the account menu of an owner", async () => {
    const { user } = menu(testWorkspace);
    await user.click(await screen.findByRole("button", { name: /Account/ }));
    const item = await screen.findByRole("menuitem", { name: /Billing/ });
    await waitFor(() => expect(item).toHaveTextContent("1,840 credits"));
    expect(item).toHaveAttribute("href", "/billing?from=ws-1");
  });

  it("leaves Billing out of the account menu without billing.enabled", async () => {
    const { user } = menu(testWorkspace, communityCapabilities);
    await user.click(await screen.findByRole("button", { name: /Account/ }));
    await screen.findByRole("menuitem", { name: /All workspaces/ });
    expect(screen.queryByRole("menuitem", { name: /Billing/ })).toBeNull();
  });
});

describe("Billing page", () => {
  it("shows the balance, the plan and the credits by source", async () => {
    page(PAYG);
    const balance = await screen.findByRole("region", { name: "Balance" });
    expect(balance).toHaveTextContent("1,840 credits");
    expect(balance).toHaveTextContent("$18.40 · may go 200 credits below zero");
    expect(screen.getByRole("region", { name: "Plan" })).toHaveTextContent(
      "renews Dec 1, 2026"
    );
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Plan credits1,240Dec 4, 2026");
    expect(rows[2]).toHaveTextContent("Top-up credits600Sep 14, 2027");
    expect(
      screen.getByRole("link", { name: "Back to Acme Support" })
    ).toHaveAttribute("href", "/w/ws-1");
  });

  it("buys 1,000 credits and shows the payment in progress", async () => {
    const { user, billing } = page(PAYG);
    await user.click(await screen.findByRole("button", { name: /Top up/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("radio", { name: "1,000 credits" })
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Buy 1,000 credits" })
    );
    expect(billing.createTopUp).toHaveBeenCalledWith({ credits: 1000 });
    expect(await screen.findByText("Payment in progress")).toBeInTheDocument();
  });

  it("refuses an auto-recharge below the smallest top-up and names it", async () => {
    const { user, billing } = page(PAYG);
    await user.click(
      await screen.findByRole("switch", { name: "Auto-recharge" })
    );
    const dialog = await screen.findByRole("dialog");
    const amount = within(dialog).getByLabelText("Buy");
    await user.clear(amount);
    await user.type(amount, "500");
    expect(
      within(dialog).getByText("At least 1,000 credits.")
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    expect(billing.updateAutoRecharge).not.toHaveBeenCalled();
  });

  it("says a payment failed, and its action opens the Customer Portal", async () => {
    const { user, billing } = page({ ...PAYG, status: "past_due" });
    expect(
      await screen.findByText("Your last payment failed")
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Update payment method/ })
    );
    expect(billing.createPortalSession).toHaveBeenCalled();
    await waitFor(() =>
      expect(location).toHaveBeenCalledWith("https://billing.stripe.com/p/test")
    );
  });

  it("names the plan on the Customer Portal button", async () => {
    page(PAYG);
    expect(
      await screen.findByRole("button", {
        name: "Manage plan, payment methods and invoices"
      })
    ).toBeInTheDocument();
  });

  it("says when a canceled plan ends, and what happens after", async () => {
    page({ ...PAYG, status: "canceling" });
    expect(
      await screen.findByText("Your plan ends on Dec 1, 2026")
    ).toBeInTheDocument();
    const banner = screen.getByText(
      "Your plan ends on Dec 1, 2026"
    ).parentElement!;
    expect(banner).toHaveTextContent(
      "Calls keep working until then. After that, the credits you have left still pay for calls at the Trial's limits, until Sep 14, 2027. Auto-recharge turns off and you can't top up. To keep Pay-as-you-go, renew it in Manage plan, payment methods and invoices."
    );
    expect(screen.getByRole("region", { name: "Plan" })).toHaveTextContent(
      "Pay-as-you-go$25 a month · cancels Dec 1, 2026"
    );
    expect(screen.getByRole("button", { name: /Top up/ })).toBeInTheDocument();
  });

  it("after a canceled plan ends, shows no plan with credits left, and offers the upgrade instead of top-ups", async () => {
    page({
      ...PAYG,
      plan: "none",
      status: "canceled",
      balance: 640,
      sources: [
        { kind: "topup", credits: 640, expiresAt: "2027-10-30T00:00:00.000Z" }
      ],
      periodEnd: ""
    });
    const title = await screen.findByText("You have no plan");
    expect(title.parentElement).toHaveTextContent(
      "Your 640 credits left still pay for calls until Oct 30, 2027. Upgrade to Pay-as-you-go to get 2,500 credits a month and buy more."
    );
    expect(screen.getByRole("region", { name: "Balance" })).toHaveTextContent(
      "$6.40 · no overdraft without a plan"
    );
    expect(screen.getByRole("region", { name: "Plan" })).toHaveTextContent(
      "No planCanceled · upgrade for 2,500 credits a month"
    );
    expect(
      screen.getByRole("button", { name: "Upgrade to Pay-as-you-go" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Top up/ })).toBeNull();
    expect(screen.queryByRole("region", { name: "Auto-recharge" })).toBeNull();
  });

  it("says calls are paused when there is no plan and no credits left", async () => {
    page({
      ...PAYG,
      plan: "none",
      status: "canceled",
      balance: 0,
      sources: [],
      periodEnd: ""
    });
    const title = await screen.findByText("You have no plan");
    expect(title.closest('[role="alert"]')).not.toBeNull();
    expect(title.parentElement).toHaveTextContent(
      "Calls are paused in your workspaces. Upgrade to Pay-as-you-go to get 2,500 credits a month and buy more."
    );
  });

  it("sends an owner with no plan and no card to the portal, and finishes the upgrade on return", async () => {
    const none = {
      ...PAYG,
      plan: "none",
      status: "canceled",
      balance: 640,
      periodEnd: ""
    };
    const { user, billing } = page(none);
    billing.subscribe.mockRejectedValueOnce(
      new Error("add a payment method in the Customer Portal first")
    );
    await user.click(
      await screen.findByRole("button", { name: "Upgrade to Pay-as-you-go" })
    );
    await waitFor(() =>
      expect(billing.createPortalSession).toHaveBeenCalledWith({
        returnUrl: "http://app.test/billing?from=ws-1&upgrade=1"
      })
    );
    const back = page(none, { route: "/billing?from=ws-1&upgrade=1" });
    await waitFor(() =>
      expect(back.billing.subscribe).toHaveBeenCalledTimes(1)
    );
  });

  it("says the Trial ended, and offers the upgrade", async () => {
    page({ ...PAYG, plan: "trial", status: "ended", balance: 0, sources: [] });
    expect(await screen.findByText("Your Trial has ended")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Pay-as-you-go" })
    ).toBeInTheDocument();
  });

  it("sends a Trial owner with no card to the portal, to finish the upgrade on return", async () => {
    const { user, billing } = page({
      ...PAYG,
      plan: "trial",
      balance: 860,
      sources: []
    });
    billing.subscribe.mockRejectedValueOnce(
      new Error("add a payment method in the Customer Portal first")
    );
    await user.click(
      await screen.findByRole("button", { name: "Upgrade to Pay-as-you-go" })
    );
    await waitFor(() =>
      expect(billing.createPortalSession).toHaveBeenCalledWith({
        returnUrl: "http://app.test/billing?from=ws-1&upgrade=1"
      })
    );
  });

  it("finishes the upgrade when the owner comes back from the portal", async () => {
    const { billing } = page(
      { ...PAYG, plan: "trial", balance: 860, sources: [] },
      { route: "/billing?from=ws-1&upgrade=1" }
    );
    await waitFor(() => expect(billing.subscribe).toHaveBeenCalledTimes(1));
  });
});
