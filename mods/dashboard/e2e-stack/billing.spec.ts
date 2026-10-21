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
import { expect, test } from "@playwright/test";

// add-billing-page 4.1: the Billing page against the stack with the billing profile and the
// Stripe fake. The stack's admin owns the seeded workspace and starts on the Trial.
//
// Environment (set by ops/rebuild/stack billing-page-e2e): RB_ADMIN_EMAIL, RB_ADMIN_PASSWORD,
// RB_STRIPE_FAKE_URL and RB_DASHBOARD_URL.

const env = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
};
const stripeFake = () => env("RB_STRIPE_FAKE_URL");

/** A call to the Stripe fake's API, as the Customer Portal would make it. */
async function stripe(
  method: string,
  path: string,
  form?: Record<string, string>
) {
  const res = await fetch(`${stripeFake()}${path}`, {
    method,
    headers: {
      authorization: "Bearer sk_test_stack",
      "content-type": "application/x-www-form-urlencoded"
    },
    body: form ? new URLSearchParams(form).toString() : undefined
  });
  expect(res.ok, `${method} ${path}: ${res.status}`).toBe(true);
  return res.json();
}

test("[DSH-039] an owner upgrades from the Trial and tops up from the Billing page", async ({
  page
}) => {
  // The Customer Portal is Stripe's: note where the page sends the owner instead of going there.
  const portal: string[] = [];
  await page.route("https://billing.stripe.com/**", (route) => {
    portal.push(route.request().url());
    return route.abort();
  });

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(env("RB_ADMIN_EMAIL"));
  await page
    .getByLabel("Password", { exact: true })
    .fill(env("RB_ADMIN_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Demo/ }).click();

  // The way in: the account menu at the bottom of the sidebar.
  await page.getByRole("button", { name: /^Account:/ }).click();
  await page.getByRole("menuitem", { name: /Billing/ }).click();
  await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Plan" })).toContainText(
    "Trial"
  );
  await expect(page.getByRole("region", { name: "Balance" })).toContainText(
    "1,000 credits"
  );

  // Adding a card happens in the portal: the page creates the customer and sends the owner there.
  await page.getByRole("button", { name: /Manage payment methods/ }).click();
  await expect.poll(() => portal.length).toBe(1);
  const [customer] = (await stripe("GET", "/v1/customers?limit=1")).data;
  const card = await stripe("POST", "/v1/payment_methods/pm_card_visa/attach", {
    customer: customer.id
  });
  await stripe("POST", `/v1/customers/${customer.id}`, {
    "invoice_settings[default_payment_method]": card.id,
    "address[country]": "US"
  });

  // Back on the page: upgrade, then wait for Stripe to confirm the first invoice.
  await page.goto("/billing");
  await page.getByRole("button", { name: "Upgrade to Pay-as-you-go" }).click();
  await expect(async () => {
    await page.reload();
    await expect(page.getByRole("region", { name: "Plan" })).toContainText(
      "Pay-as-you-go",
      {
        timeout: 2000
      }
    );
  }).toPass({ timeout: 60_000 });
  // The Trial's 1,000 credits and the plan's 2,500.
  await expect(page.getByRole("region", { name: "Balance" })).toContainText(
    "3,500 credits"
  );

  // A top-up: in progress, then the credits.
  await page.getByRole("button", { name: /Top up/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "1,000 credits" }).click();
  await dialog.getByRole("button", { name: "Buy 1,000 credits" }).click();
  await expect(page.getByText("Payment in progress")).toBeVisible();
  await expect(page.getByRole("region", { name: "Balance" })).toContainText(
    "4,500 credits",
    {
      timeout: 30_000
    }
  );
  await expect(page.getByRole("row", { name: /Top-up credits/ })).toContainText(
    "1,000"
  );
});
