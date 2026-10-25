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
import { createRequire } from "node:module";
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
  await page
    .getByLabel("Password", { exact: true })
    .fill(env("E2E_REAL_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: env("E2E_REAL_WORKSPACE") }).click();
  const sidebar = page.getByRole("complementary", { name: "Main" });

  // The workspace's call refs before this call, from the API: the new one is this call's, so the
  // row it opens is checked by ref, not by its text (two calls in the same minute with the same
  // length and agent read alike, and another case's call can be the newest row).
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SDK = require("@fonoster/sdk");
  // Over TLS, trusting the stack's generated CA (FONOSTER_CA_FILE, set by real-env.cjs).
  const client = new SDK.Client({
    accessKeyId: env("E2E_REAL_WORKSPACE_KEY"),
    endpoint: `localhost:${new URL(env("E2E_REAL_API_URL")).port}`
  });
  await client.login(env("E2E_REAL_EMAIL"), env("E2E_REAL_PASSWORD"));
  const calls = new SDK.Calls(client);
  const callRefs = async (): Promise<string[]> =>
    (await calls.listCalls({ pageSize: 100 })).items.map(
      (c: { ref: string }) => c.ref
    );
  const before = new Set(await callRefs());
  const table = page.getByRole("table", { name: "Calls" });

  // A call to the seeded agent: the fake microphone speaks for a few seconds, then hang up.
  await sidebar.getByRole("link", { name: "Agents", exact: true }).click();
  // In the Agents table: Calls rows name the agent too, until the page has changed.
  await page
    .getByRole("table", { name: "Agents" })
    .getByText(env("E2E_REAL_APP"), { exact: true })
    .click();
  await page.getByRole("button", { name: "Talk to agent" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Connected")).toBeVisible({ timeout: 30_000 });
  // Muted, so the fake microphone doesn't cut the greeting off: the agent speaks it through.
  await drawer.getByRole("button", { name: "Mute" }).click();
  await page.waitForTimeout(8_000);
  await drawer.getByRole("button", { name: "Hang up" }).click();
  await expect(drawer.getByText("Call ended")).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  // Its record appears once sealed: the one new ref. Then it is the newest row in Calls (the real
  // cases run one at a time), and opening that row opens this call.
  let ref = "";
  await expect
    .poll(
      async () => {
        ref = (await callRefs()).find((r) => !before.has(r)) ?? "";
        return ref;
      },
      { timeout: 90_000, intervals: [3_000] }
    )
    .not.toBe("");
  await sidebar.getByRole("link", { name: "Calls", exact: true }).click();
  await page.reload();
  const fresh = table.getByRole("row").nth(1);
  await expect(fresh).toContainText(env("E2E_REAL_APP"), { timeout: 15_000 });
  await expect(fresh).toContainText("Completed");
  await fresh.click();
  await expect(page).toHaveURL(new RegExp(`/${ref}$`));

  // Who tested and the agent they called, not the SIP leg's internal names (#1060).
  await expect(
    page.getByRole("heading", {
      name: `${env("E2E_REAL_EMAIL")} with ${env("E2E_REAL_APP")}`
    })
  ).toBeVisible();
  // The agent's greeting, with when it started and how long it lasted.
  const greeting = page
    .getByRole("region", { name: "Transcript" })
    .getByRole("listitem", { name: "agent turn" })
    .first();
  await expect(greeting).toBeVisible();
  await expect(greeting).toContainText(/^0:0\d/);
  await expect(greeting).toContainText(/\d\.\d s/);
  // The recording plays in the page.
  await expect(page.getByLabel("Call recording")).toHaveAttribute(
    "src",
    /^blob:/,
    {
      timeout: 15_000
    }
  );
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute(
    "download",
    /\.wav$/
  );
});
