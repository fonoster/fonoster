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

// The `real` project: no mock, the running platform (ops/rebuild/stack up && seed), the seeded
// owner and agent, Chromium with a fake microphone. See playwright.config.ts and real-env.cjs.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

test("[DSH-015] talks to the agent from the browser: call, mute, hang up, record", async ({
  page
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email").fill(env("E2E_REAL_EMAIL"));
  await page.getByLabel("Password", { exact: true }).fill(env("E2E_REAL_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
  await page.getByRole("link", { name: env("E2E_REAL_WORKSPACE") }).click();
  await page.getByRole("link", { name: "Agents", exact: true }).click();
  await page.getByText(env("E2E_REAL_APP"), { exact: true }).click();

  // Call: the drawer connects and the timer runs.
  await page.getByRole("button", { name: "Talk to agent" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Connected")).toBeVisible({ timeout: 30_000 });
  const timer = drawer.getByLabel("Call time");
  await expect(timer).toBeVisible();
  const first = await timer.textContent();
  await expect.poll(() => timer.textContent(), { timeout: 5_000 }).not.toBe(first);

  // Mute toggles; hang up ends the call and offers another.
  await drawer.getByRole("button", { name: "Mute" }).click();
  await expect(drawer.getByRole("button", { name: "Unmute" })).toBeVisible();
  await drawer.getByRole("button", { name: "Hang up" }).click();
  await expect(drawer.getByText("Call ended")).toBeVisible({ timeout: 15_000 });
  await expect(drawer.getByRole("button", { name: "Call again" })).toBeVisible();
  await page.keyboard.press("Escape");

  // The call was recorded: the agent's Calls tab lists it once the record is sealed.
  await page
    .getByRole("navigation", { name: "Agent sections" })
    .getByRole("link", { name: "Calls", exact: true })
    .click();
  await expect
    .poll(
      async () => {
        await page.reload();
        return page.getByText("No calls yet").count();
      },
      { timeout: 60_000, intervals: [3_000] }
    )
    .toBe(0);
});
