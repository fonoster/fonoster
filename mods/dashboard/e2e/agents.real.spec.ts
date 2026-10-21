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

// The `real` project against the running platform: an agent made in the UI answers a call.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

test("[DSH-042] an agent created in the UI answers a browser call, then is deleted", async ({
  page
}) => {
  test.setTimeout(180_000);
  const name = `E2E agent ${String(Date.now()).slice(-6)}`;
  await page.goto("/");
  await page.getByLabel("Email").fill(env("E2E_REAL_EMAIL"));
  await page
    .getByLabel("Password", { exact: true })
    .fill(env("E2E_REAL_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: env("E2E_REAL_WORKSPACE") }).click();
  await page
    .getByRole("complementary", { name: "Main" })
    .getByRole("link", { name: "Agents", exact: true })
    .click();

  await expect(async () => {
    await page
      .getByRole("button", { name: "Create agent" })
      .first()
      .click({ timeout: 2000 });
    await expect(page.getByRole("dialog", { name: "New agent" })).toBeVisible({
      timeout: 2000
    });
  }).toPass({ timeout: 15_000 });
  await page.getByRole("radio", { name: /Receptionist/ }).click();
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create agent" })
    .click();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // Its first call: the platform runs the agent the UI just saved.
  await page.getByRole("button", { name: "Talk to agent" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Connected")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3_000);
  await drawer.getByRole("button", { name: "Hang up" }).click();
  await expect(drawer.getByText("Call ended")).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Advanced" }).click();
  await page
    .getByRole("region", { name: "Danger zone" })
    .getByRole("button")
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Type DELETE to confirm/).fill("DELETE");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/agents$/);
  await expect(page.getByText(name)).toHaveCount(0);
});
