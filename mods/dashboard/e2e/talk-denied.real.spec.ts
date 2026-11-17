/**
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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

// The `real` project against the running platform (ops/rebuild/stack up && seed): a browser test
// call whose token is the Demo workspace's but whose X-App-Ref names the other workspace's app.
// Routr verifies the token and forwards it to the Roomr nodes' Peer (forwardConnectToken), and
// AppBridge refuses the call because the token's workspace doesn't own the app.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

test("[DSH-069] a test call naming another workspace's app is refused and recorded test_call_denied", async ({
  page
}) => {
  test.setTimeout(180_000);
  const ownApp = env("E2E_REAL_APP_REF");
  const otherApp = env("E2E_REAL_OTHER_APP_REF");

  // The other workspace's records before the call, from the API.
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SDK = require("@fonoster/sdk");
  const client = new SDK.Client({
    accessKeyId: env("E2E_REAL_OTHER_WORKSPACE_KEY"),
    endpoint: `localhost:${new URL(env("E2E_REAL_API_URL")).port}`
  });
  await client.login(env("E2E_REAL_EMAIL"), env("E2E_REAL_PASSWORD"));
  const records = new SDK.CallRecords(client);
  const denied = async () =>
    (
      await records.listRecords({ appRef: otherApp, pageSize: 100 })
    ).items.filter(
      (r: { failureReason: string | null }) =>
        r.failureReason === "test_call_denied"
    ).length;
  const before = await denied();

  // The browser's INVITE names the other workspace's app; nothing else changes.
  let rewritten = false;
  await page.routeWebSocket(/\/sip$/, (ws) => {
    const server = ws.connectToServer();
    ws.onMessage((message) => {
      if (typeof message === "string" && message.startsWith("INVITE ")) {
        rewritten = message.includes(`X-App-Ref: ${ownApp}`);
        server.send(
          message.replace(`X-App-Ref: ${ownApp}`, `X-App-Ref: ${otherApp}`)
        );
      } else server.send(message);
    });
  });

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
  await page
    .getByRole("table", { name: "Agents" })
    .getByText(env("E2E_REAL_APP"), { exact: true })
    .click();
  await page.getByRole("button", { name: "Talk to agent" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Call", exact: true }).click();

  await expect(drawer.getByText("Call failed")).toBeVisible({
    timeout: 30_000
  });
  await expect(drawer.getByText("Connected")).toHaveCount(0);
  expect(rewritten).toBe(true);
  await expect
    .poll(denied, { timeout: 90_000, intervals: [3_000] })
    .toBe(before + 1);
});
