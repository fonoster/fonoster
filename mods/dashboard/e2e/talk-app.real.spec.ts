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
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

// The `real` project against the running platform (ops/rebuild/stack up && seed). The test runs a
// stream app of its own (the Voice SDK's VoiceServer on this machine; AppBridge reaches it as
// host.docker.internal, allowed by the dev stack), creates a STREAM app pointing at it through the
// UI, and calls it from Talk to app. The app's name is unique per run and deleted after.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

const require = createRequire(import.meta.url);
const label = `e2e-stream-${String(Date.now()).slice(-6)}`;

/** A free port on this machine for the stream app. */
const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => resolve(port));
    });
  });

/** Deletes the app this run created, through the SDK, if a UI step failed midway. */
async function cleanUp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SDK = require("@fonoster/sdk");
  const port = new URL(env("E2E_REAL_API_URL")).port;
  const client = new SDK.Client({
    accessKeyId: env("E2E_REAL_WORKSPACE_KEY"),
    endpoint: `localhost:${port}`
  });
  await client.login(env("E2E_REAL_EMAIL"), env("E2E_REAL_PASSWORD"));
  const apps = new SDK.Applications(client);
  const { items } = await apps.listApplications({ pageSize: 100 });
  for (const app of items.filter((a: { name?: string }) => a.name === label))
    await apps.deleteApplication(app.ref).catch(() => undefined);
}

let server: { close?: () => void } | undefined;

test.afterEach(async () => {
  server?.close?.();
  await cleanUp().catch((e) =>
    console.warn(`cleanup: ${(e as Error).message}`)
  );
});

test("[DSH-065] talks to a stream app from the browser: call, hang up, record", async ({
  page
}) => {
  test.setTimeout(120_000);
  const port = await freePort();

  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email").fill(env("E2E_REAL_EMAIL"));
  await page
    .getByLabel("Password", { exact: true })
    .fill(env("E2E_REAL_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
  await page.getByRole("link", { name: env("E2E_REAL_WORKSPACE") }).click();

  // A stream app pointing at the server this test runs; its secret is shown once.
  await page.getByRole("link", { name: "Apps", exact: true }).click();
  await page.getByRole("button", { name: /Create app/ }).click();
  const create = page.getByRole("dialog", { name: "New app" });
  await create.getByLabel("Name").fill(label);
  await create.getByLabel("URL").fill(`ws://host.docker.internal:${port}`);
  await create.getByRole("button", { name: "Create app" }).click();
  const shown = page.getByRole("dialog", { name: "Save your signing secret" });
  const secret = (
    await shown.getByLabel("Signing secret").textContent()
  )?.trim();
  expect(secret).toBeTruthy();

  // The stream app: greets the caller and stays on the call until it ends.
  const sessions: { appRef: string }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { VoiceServer } = require("@fonoster/voice");
  server = new VoiceServer({ port, signingSecret: secret });
  (server as { listen: (h: (s: unknown) => Promise<void>) => void }).listen(
    async (session) => {
      const s = session as {
        appRef: string;
        ended: boolean;
        say: (t: string) => Promise<unknown>;
        gather: (o: object) => Promise<unknown>;
      };
      sessions.push({ appRef: s.appRef });
      await s.say("Hi, this is the stream app.").catch(() => undefined);
      while (!s.ended) await s.gather({ timeout: 5000 }).catch(() => undefined);
    }
  );

  await shown.getByLabel("I've saved it").check();
  await shown.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { name: label })).toBeVisible();

  // Call: the drawer connects to the app, and the app's session starts.
  await page.getByRole("button", { name: "Talk to app" }).click();
  const drawer = page.getByRole("dialog", { name: `Talk to ${label}` });
  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Connected")).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => sessions.length, { timeout: 15_000 }).toBe(1);
  const appRef = new URL(page.url()).pathname.split("/").pop();
  expect(sessions[0].appRef).toBe(appRef);

  // Hang up ends the call and offers another.
  await drawer.getByRole("button", { name: "Hang up" }).click();
  await expect(drawer.getByText("Call ended")).toBeVisible({ timeout: 15_000 });
  await expect(
    drawer.getByRole("button", { name: "Call again" })
  ).toBeVisible();
  await page.keyboard.press("Escape");

  // The call was recorded as handled by the app: its Recent calls lists it once sealed.
  await expect
    .poll(
      async () => {
        await page.reload();
        await expect(page.getByRole("heading", { name: label })).toBeVisible();
        return page.getByText("No calls yet.").count();
      },
      { timeout: 60_000, intervals: [3_000] }
    )
    .toBe(0);
});
