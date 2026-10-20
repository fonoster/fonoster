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
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import Stripe from "stripe";
import { StripeFakeServer } from "../../src/server";

// add-stripe-fake "The viewer shows what Stripe would see": the two scenarios, and the theme.

let fake: StripeFakeServer;
let stripe: Stripe;
let hooks: Server;
let customer: string;

const control = (path: string, body: object = {}) =>
  fetch(`${fake.url}/_fake/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

test.beforeAll(async () => {
  fake = await new StripeFakeServer({
    port: 0,
    host: "127.0.0.1",
    viewerDir: join(__dirname, "../dist")
  }).start();
  stripe = new Stripe("sk_test_viewer", {
    host: "127.0.0.1",
    port: Number(new URL(fake.url).port),
    protocol: "http",
    maxNetworkRetries: 0
  });
  hooks = createServer((_req, res) => res.writeHead(200).end());
  await new Promise<void>((r) => hooks.listen(0, "127.0.0.1", r));
  await stripe.webhookEndpoints.create({
    url: `http://127.0.0.1:${(hooks.address() as AddressInfo).port}/stripe`,
    enabled_events: ["*"]
  });
  const c = await stripe.customers.create({ name: "Acme" });
  customer = c.id;
  const pm = await stripe.paymentMethods.attach("pm_card_visa", { customer });
  await stripe.customers.update(customer, {
    invoice_settings: { default_payment_method: pm.id }
  });
  for (const [category, cents] of [
    ["promotional", 1240],
    ["paid", 600]
  ] as const)
    await stripe.billing.creditGrants.create({
      customer,
      category,
      amount: { type: "monetary", monetary: { currency: "usd", value: cents } },
      applicability_config: { scope: { price_type: "metered" } }
    });
});

test.afterAll(async () => {
  await fake?.stop();
  hooks?.close();
});

test("shows credits as billing shows them", async ({ page }) => {
  await page.goto(fake.url);
  await expect(
    page.getByRole("group", { name: "Credit balance" })
  ).toContainText("1,840 credits$18.40");
  await expect(
    page.getByRole("group", { name: "Plan credits left" })
  ).toContainText("1,240");
  await expect(
    page.getByRole("group", { name: "Top-up credits" })
  ).toContainText("600");
});

test("shows a failed payment as it happens, with Replay", async ({ page }) => {
  await page.goto(`${fake.url}/#/webhooks`);
  await expect(page.getByRole("heading", { name: "Webhooks" })).toBeVisible();
  await expect(page.getByText("invoice.payment_failed")).toHaveCount(0);

  await control(`customers/${customer}/next_payment`, { outcome: "decline" });
  // A subscription's first invoice is charged at once, and the decline fails it.
  const product = await stripe.products.create({ name: "Plan" });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: 2500,
    recurring: { interval: "month" }
  });
  await stripe.subscriptions.create({ customer, items: [{ price: price.id }] });

  const row = page
    .getByRole("row")
    .filter({ hasText: "invoice.payment_failed" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("200");
  await expect(row.getByRole("button", { name: "Replay" })).toBeVisible();
});

test("switches between light and dark, and remembers it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(fake.url);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute(
    "aria-checked",
    "true"
  );
});
