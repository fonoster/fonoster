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

// The `real` project against the stack behind HTTPS (ops/rebuild/stack tls on, E2E_REAL_URL
// https://localhost:<RB_HTTPS_PORT>): the browser's SIP goes over WSS to Envoy's /sip, which Envoy
// proxies to Routr, the path every production install with a certificate takes.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

test("[DSH-063] talks to the agent from an HTTPS dashboard: SIP over WSS connects and hangs up", async ({
  page
}) => {
  test.setTimeout(120_000);
  const sockets: string[] = [];
  page.on("websocket", (ws) => sockets.push(ws.url()));

  await page.goto("/");
  expect(page.url()).toMatch(/^https:\/\//);
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email").fill(env("E2E_REAL_EMAIL"));
  await page
    .getByLabel("Password", { exact: true })
    .fill(env("E2E_REAL_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: env("E2E_REAL_WORKSPACE") }).click();
  await page.getByRole("link", { name: "Agents", exact: true }).click();
  await page.getByText(env("E2E_REAL_APP"), { exact: true }).click();

  await page.getByRole("button", { name: "Talk to agent" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Connected")).toBeVisible({ timeout: 30_000 });
  expect(sockets.some((url) => /^wss:\/\/[^/]+\/sip/.test(url))).toBe(true);

  await drawer.getByRole("button", { name: "Hang up" }).click();
  await expect(drawer.getByText("Call ended")).toBeVisible({ timeout: 15_000 });
  await expect(
    drawer.getByRole("button", { name: "Call again" })
  ).toBeVisible();
});
