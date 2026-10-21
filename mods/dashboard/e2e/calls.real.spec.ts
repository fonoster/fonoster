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

// The `real` project against the running platform (ops/rebuild/stack up && seed): a browser call
// to the seeded agent, which records calls, then that call's record in Calls.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

test("[DSH-034] a browser call shows up in Calls with its transcript and a playable recording", async ({
  page
}) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.getByLabel("Email").fill(env("E2E_REAL_EMAIL"));
  await page.getByLabel("Password", { exact: true }).fill(env("E2E_REAL_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: env("E2E_REAL_WORKSPACE") }).click();

  // The calls there are before this one.
  await page.getByRole("link", { name: "Calls", exact: true }).click();
  await page.getByRole("combobox", { name: "Period" }).click();
  await page.getByRole("option", { name: "Last 24 hours" }).click();
  const table = page.getByRole("table", { name: "Calls" });
  await expect(table.or(page.getByText("No calls match the filters."))).toBeVisible();
  const before = new Set(
    await table.getByRole("row").evaluateAll((rows) =>
      rows.map((r) => r.textContent ?? "")
    )
  );

  // A call to the seeded agent: the fake microphone speaks for a few seconds, then hang up.
  await page.getByRole("link", { name: "Agents", exact: true }).click();
  await page.getByText(env("E2E_REAL_APP"), { exact: true }).click();
  await page.getByRole("button", { name: "Talk to agent" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Connected")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(8_000);
  await drawer.getByRole("button", { name: "Hang up" }).click();
  await expect(drawer.getByText("Call ended")).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  // Its record appears once sealed; open it.
  await page.getByRole("link", { name: "Calls", exact: true }).click();
  let fresh = table.getByRole("row").filter({ hasNotText: /^Call/ });
  await expect
    .poll(
      async () => {
        await page.reload();
        const rows = await table.getByRole("row").evaluateAll((rs) =>
          rs.map((r) => r.textContent ?? "")
        );
        return rows.filter((r) => !before.has(r) && !r.startsWith("Call")).length;
      },
      { timeout: 90_000, intervals: [3_000] }
    )
    .toBeGreaterThan(0);
  fresh = table.getByRole("row").nth(1);
  await expect(fresh).toContainText("completed");
  await fresh.click();

  await expect(page.getByRole("heading", { name: /→/ })).toBeVisible();
  await expect(page.getByText("Answered by")).toBeVisible();
  await expect(page.getByText(env("E2E_REAL_APP")).first()).toBeVisible();
  // The agent spoke (its greeting), timed.
  const agentTurn = page
    .getByRole("region", { name: "Transcript" })
    .getByRole("listitem", { name: "agent turn" })
    .first();
  await expect(agentTurn).toBeVisible();
  await expect(agentTurn).toContainText(/\d\.\d s · \d/);
  // The recording plays in the page.
  await expect(page.getByLabel("Call recording")).toHaveAttribute("src", /^blob:/, {
    timeout: 15_000
  });
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute(
    "download",
    /\.wav$/
  );
});
