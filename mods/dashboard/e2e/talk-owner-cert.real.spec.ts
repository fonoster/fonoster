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

// The `real` project against the stack serving a certificate of the owner's (`ops/rebuild/stack
// owner-cert on`: TLS_CERT and TLS_KEY from a test CA of their own, not the generated one), the
// path of an install that went live with Let's Encrypt or another CA: Envoy sends HSTS, and the
// browser's SIP still goes over WSS to Envoy's /sip. prove.sh turns the owner certificate on
// around this case and sets E2E_REAL_OWNER_CERT; on the generated certificate it is skipped.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

test("[DSH-064] talks to the agent on the owner's certificate: HSTS is sent, SIP over WSS connects and hangs up", async ({
  page
}) => {
  test.skip(
    process.env.E2E_REAL_OWNER_CERT !== "1",
    "needs the stack on an owner certificate (ops/rebuild/stack owner-cert on; prove.sh does it)"
  );
  test.setTimeout(120_000);
  const sockets: string[] = [];
  page.on("websocket", (ws) => sockets.push(ws.url()));

  const response = await page.goto("/");
  expect(page.url()).toMatch(/^https:\/\//);
  expect(response?.headers()["strict-transport-security"]).toMatch(
    /max-age=\d+/
  );
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
});
