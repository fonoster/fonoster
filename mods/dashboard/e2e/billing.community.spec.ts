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
import { ada, expect, test, tokens } from "./fixtures";

test.use({ variant: "community" });

test("[DSH-040] a self-hosted install has no Billing, even for an owner", async ({
  page,
  api
}) => {
  api.on("Identity/ExchangeCredentials", () => tokens(ada));
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();

  await page.getByRole("button", { name: /^Account:/ }).click();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Billing/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.goto("/billing?from=ws-1");
  await expect(page).toHaveURL(/\/workspaces$/);
  expect(api.callsTo("Billing/GetBilling")).toHaveLength(0);
});
