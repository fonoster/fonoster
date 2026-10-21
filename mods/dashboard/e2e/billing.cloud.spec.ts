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
/*
 * The Billing page on Cloud (change add-billing-page) against a billing account that
 * behaves like the billing service in front of Stripe (`e2e/billing.ts`). The Customer
 * Portal is Stripe's: navigations to it are recorded and stopped.
 */
import type { Page } from "@playwright/test";
import { FakeBilling, billingPb } from "./billing";
import { ada, expect, identity, test, tokens, workspace } from "./fixtures";
import type { GrpcWebMock } from "./grpc-web";

test.use({ variant: "cloud" });

async function signIn(page: Page, api: GrpcWebMock, billing?: FakeBilling) {
  billing?.install(api);
  api.on("Identity/ExchangeCredentials", () => tokens(ada));
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await expect(page).toHaveURL(/\/w\/ws-1$/);
}

/** Records every visit to Stripe's Customer Portal and stops it there. */
async function stubPortal(page: Page) {
  const visits: string[] = [];
  await page.route("https://billing.stripe.com/**", (route) => {
    visits.push(route.request().url());
    return route.abort();
  });
  return visits;
}

async function openBilling(page: Page) {
  await page.getByRole("button", { name: /^Account:/ }).click();
  await page.getByRole("menuitem", { name: /Billing/ }).click();
  await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
}

test("[DSH-035] offers Billing only to an owner on Cloud", async ({
  page,
  api
}) => {
  // Ada owns no workspace: no Billing item, and /billing goes to the workspace picker.
  api.on("Identity/ListWorkspaces", () => {
    const list = new identity.ListWorkspacesResponse();
    list.setItemsList([workspace("ws-1", "Acme Support", "u-someone-else")]);
    return list;
  });
  await signIn(page, api, new FakeBilling());
  await page.getByRole("button", { name: /^Account:/ }).click();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Billing/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.goto("/billing?from=ws-1");
  await expect(page).toHaveURL(/\/workspaces$/);

  // As the owner, Billing is in the menu and opens a page of its own.
  api.on("Identity/ListWorkspaces", () => {
    const list = new identity.ListWorkspacesResponse();
    list.setItemsList([workspace("ws-1", "Acme Support", ada.ref)]);
    return list;
  });
  await page.goto("/w/ws-1");
  await openBilling(page);
  await expect(page).toHaveURL(/\/billing\?from=ws-1/);
});

test("[DSH-036] shows the account, and says when a payment failed or the Trial ended", async ({
  page,
  api
}) => {
  const visits = await stubPortal(page);
  const billing = new FakeBilling();
  billing.plan = "payg";
  billing.overdraft = 200;
  billing.sources = [
    { kind: "plan", credits: 1240, expiresAt: "2026-12-04T00:00:00.000Z" },
    { kind: "topup", credits: 600, expiresAt: "2027-09-14T00:00:00.000Z" }
  ];
  await signIn(page, api, billing);
  await openBilling(page);

  await expect(page.getByRole("region", { name: "Balance" })).toContainText(
    "1,840 credits"
  );
  await expect(page.getByRole("region", { name: "Balance" })).toContainText(
    "may go 200 credits below zero"
  );
  await expect(page.getByRole("region", { name: "Plan" })).toContainText(
    "Pay-as-you-go"
  );
  await expect(page.getByRole("region", { name: "Plan" })).toContainText(
    "renews"
  );
  await expect(page.getByRole("row", { name: /Plan credits/ })).toContainText(
    "1,240"
  );
  await expect(page.getByRole("row", { name: /Top-up credits/ })).toContainText(
    "600"
  );
  await page
    .getByRole("button", { name: /Manage payment methods and invoices/ })
    .click();
  await expect.poll(() => visits.length).toBe(1);

  // Past due: the page says so, and its primary action opens the portal.
  billing.status = "past_due";
  await page.goto("/billing?from=ws-1");
  await expect(page.getByText("Your last payment failed")).toBeVisible();
  await page.getByRole("button", { name: /Update payment method/ }).click();
  await expect.poll(() => visits.length).toBe(2);

  // The Trial ended: calls are paused, and the primary action is the upgrade.
  billing.plan = "trial";
  billing.status = "ended";
  billing.sources = [];
  await page.goto("/billing?from=ws-1");
  await expect(page.getByText("Your Trial has ended")).toBeVisible();
  await expect(
    page.getByText(/Calls are paused in your workspaces/)
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upgrade to Pay-as-you-go" })
  ).toBeVisible();
});

test("[DSH-037] tops up 1,000 credits and refuses an auto-recharge below the smallest top-up", async ({
  page,
  api
}) => {
  const billing = new FakeBilling();
  billing.plan = "payg";
  billing.sources = [
    { kind: "plan", credits: 500, expiresAt: "2026-12-04T00:00:00.000Z" }
  ];
  await signIn(page, api, billing);
  await openBilling(page);

  await page.getByRole("button", { name: "Top up" }).click();
  await page.getByRole("radio", { name: /^1,000 credits/ }).click();
  await page.getByRole("button", { name: "Buy 1,000 credits" }).click();
  await expect(page.getByText("Payment in progress")).toBeVisible();
  expect(
    billingPb.CreateTopUpRequest.deserializeBinary(
      api.callsTo("Billing/CreateTopUp")[0].request
    ).toObject().credits
  ).toBe(1000);
  // Once confirmed, the balance grows by the credits bought, whatever tax was charged.
  await expect(page.getByRole("region", { name: "Balance" })).toContainText(
    "1,500 credits",
    {
      timeout: 10_000
    }
  );

  await page.getByRole("switch", { name: "Auto-recharge" }).click();
  const dialog = page.getByRole("dialog", { name: "Auto-recharge" });
  await dialog
    .getByLabel("Recharge automatically")
    .check()
    .catch(() => undefined);
  await dialog.getByLabel("When the balance falls below").fill("200");
  await dialog.getByLabel("Buy").fill("500");
  await expect(dialog.getByText("At least 1,000 credits.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save" })).toBeDisabled();
  expect(api.callsTo("Billing/UpdateAutoRecharge")).toHaveLength(0);
  await dialog.getByLabel("Buy").fill("1000");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("region", { name: "Auto-recharge" })
  ).toContainText("Below 200 credits, buy 1,000");
});

test("[DSH-038] upgrades from the Trial, through the portal when there is no card", async ({
  page,
  api
}) => {
  const visits = await stubPortal(page);
  const billing = new FakeBilling();
  await signIn(page, api, billing);
  await openBilling(page);
  await expect(page.getByRole("region", { name: "Plan" })).toContainText(
    "Trial"
  );

  // No card yet: the portal opens to add one, and asks to come back with ?upgrade=1.
  await page.getByRole("button", { name: "Upgrade to Pay-as-you-go" }).click();
  await expect.poll(() => visits.length).toBe(1);
  expect(decodeURIComponent(visits[0])).toMatch(
    /return=.*\/billing\?from=ws-1&upgrade=1/
  );

  // Back from the portal with a card: the upgrade finishes, once, and the plan credits arrive.
  billing.hasPaymentMethod = true;
  await page.goto("/billing?from=ws-1&upgrade=1");
  await expect(page.getByRole("region", { name: "Plan" })).toContainText(
    "Pay-as-you-go"
  );
  await expect(page.getByRole("region", { name: "Balance" })).toContainText(
    "3,500 credits",
    {
      timeout: 20_000
    }
  );
  expect(api.callsTo("Billing/Subscribe")).toHaveLength(2);
});
