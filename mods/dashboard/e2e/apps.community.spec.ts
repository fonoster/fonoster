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
/*
 * Agents and apps (spec change dashboard-agent-and-app-editors): created, edited,
 * renamed and deleted through the UI against in-memory applications that store
 * what the dashboard sends, the way the API does.
 */
import type { Page } from "@playwright/test";
import { FakeApplications } from "./apps";
import { ada, expect, test, tokens } from "./fixtures";
import { numbers, type GrpcWebMock } from "./grpc-web";

test.use({ variant: "community" });

async function signIn(
  page: Page,
  api: GrpcWebMock,
  apps = new FakeApplications()
) {
  apps.install(api);
  api
    .on("Identity/ExchangeCredentials", () => tokens(ada))
    .on("Numbers/ListNumbers", () => new numbers.ListNumbersResponse());
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await expect(page).toHaveURL(/\/w\/ws-1$/);
  return apps;
}

/** The agent's saved Autopilot configuration (the intelligence Struct), as plain values. */
function agentConfig(apps: FakeApplications, ref: string) {
  return apps.apps.get(ref)!.getIntelligence().getConfig().toJavaScript() as {
    conversationSettings: { systemPrompt: string; firstMessage?: string };
    languageModel: {
      tools: {
        name: string;
        requestStartMessage?: string;
        operation: { url: string };
      }[];
    };
  };
}

/**
 * Clicks a screen's Create button until its form opens: while the list loads, the
 * header's button can be replaced by the empty state's, and a click on the old one is lost.
 */
async function openCreate(page: Page, name: string) {
  await expect(async () => {
    await page.getByRole("button", { name }).first().click({ timeout: 2000 });
    await expect(
      page
        .getByRole("dialog")
        .or(page.getByRole("heading", { name: /^New / }))
        .first()
    ).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

test("[DSH-028] creates an agent from a template, saves its prompt and a tool, renames and deletes it", async ({
  page,
  api
}) => {
  const apps = await signIn(page, api);
  await page.getByRole("link", { name: "Agents", exact: true }).click();

  await openCreate(page, "Create agent");
  await page.getByRole("radio", { name: /Receptionist/ }).click();
  await page.getByLabel("Name", { exact: true }).fill("Front desk");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create agent" })
    .click();
  await expect(page.getByText("Agent created")).toBeVisible();
  await expect(page).toHaveURL(/\/agents\/app-1\/configure$/);
  // Created on the keyless provider the catalog offers.
  expect(apps.saved("app-1")).toMatchObject({
    name: "Front desk",
    type: 1, // AUTOPILOT
    speech: expect.objectContaining({ language: "en-US" })
  });
  // The catalog offers only the keyless fake provider: the new agent uses its voice and models.
  const created = apps.saved("app-1");
  expect(created.speech?.voice).toMatch(/^fake\//);
  expect(JSON.stringify(agentConfig(apps, "app-1").languageModel)).toContain(
    "fake"
  );
  // ...while the voice picker offers both providers by label.
  await page.getByRole("button", { name: /^Voice/ }).click();
  await page.getByRole("combobox", { name: "Provider" }).click();
  await expect(page.getByRole("option", { name: "Fakes" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Deepgram" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByLabel("System prompt").fill("You answer for Acme. Be brief.");
  await expect(page.getByText("Unsaved changes")).toBeVisible();

  // A tool with a bad name: Save marks the Tools tab and sends nothing.
  await page.getByRole("link", { name: /^Tools/ }).click();
  await page
    .getByRole("button", { name: /Add tool/ })
    .first()
    .click();
  await page.getByLabel("Tool name").fill("check invoice");
  await page.getByLabel("Description").fill("Looks up an invoice by number.");
  await page.getByLabel("URL").fill("https://api.acme.example/invoices");
  const updatesBefore = api.callsTo("Applications/UpdateApplication").length;
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("Fix the highlighted fields in Tools before saving.")
  ).toBeVisible();
  expect(api.callsTo("Applications/UpdateApplication")).toHaveLength(
    updatesBefore
  );

  await page.getByLabel("Tool name").fill("check_invoice");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Agent saved")).toBeVisible();
  const config = agentConfig(apps, "app-1");
  expect(config.conversationSettings.systemPrompt).toBe(
    "You answer for Acme. Be brief."
  );
  expect(config.languageModel.tools).toEqual([
    expect.objectContaining({
      name: "check_invoice",
      operation: expect.objectContaining({
        url: "https://api.acme.example/invoices"
      })
    })
  ]);
  await expect(page.getByText("Unsaved changes")).toHaveCount(0);

  // Rename inline: Enter saves.
  await page.getByRole("button", { name: "Rename agent" }).click();
  await page.getByLabel("Agent name").fill("Acme front desk");
  await page.getByLabel("Agent name").press("Enter");
  await expect(
    page.getByRole("heading", { name: "Acme front desk" })
  ).toBeVisible();
  await expect.poll(() => apps.saved("app-1").name).toBe("Acme front desk");

  // Delete from Advanced, after typing DELETE.
  await page.getByRole("link", { name: "Advanced" }).click();
  await page
    .getByRole("region", { name: "Danger zone" })
    .getByRole("button")
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Delete", exact: true })
  ).toBeDisabled();
  await dialog.getByLabel(/Type DELETE to confirm/).fill("DELETE");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/agents$/);
  expect(apps.apps.size).toBe(0);
});

/** Ticks "I've saved it" and closes a show-once secret dialog. */
async function savedIt(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("I've saved it").check();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
}

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("[DSH-029] creates an app, shows its secret once, saves its recording policy, rotates the secret and deletes it", async ({
  page,
  api
}) => {
  // The app page lists its recent calls from the records API: none yet.
  await page.route(/\/api\/records(\?.*)?$/, (route) =>
    route.fulfill({
      json: { items: [], nextPageToken: null },
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*"
      }
    })
  );
  const apps = await signIn(page, api);
  await page.getByRole("link", { name: "Apps", exact: true }).click();

  await openCreate(page, "Create app");
  const create = page.getByRole("dialog", { name: "New app" });
  await create.getByLabel("Name", { exact: true }).fill("Order status");
  await create.getByLabel("URL").fill("https://voice.acme.example/session");
  await create.getByRole("button", { name: "Create app" }).click();
  await expect(
    create.getByText("Must start with ws:// or wss://")
  ).toBeVisible();
  expect(api.callsTo("Applications/CreateApplication")).toHaveLength(0);

  await create.getByLabel("URL").fill("wss://voice.acme.example/session");
  await create.getByRole("button", { name: "Create app" }).click();
  await expect(page.getByText("App created")).toBeVisible();
  await expect(page).toHaveURL(/\/apps\/app-1$/);
  expect(apps.saved("app-1")).toMatchObject({
    name: "Order status",
    type: 0, // STREAM
    url: "wss://voice.acme.example/session",
    protocol: "fonoster"
  });

  // The signing secret, once.
  const secretDialog = page.getByRole("dialog", {
    name: "Save your signing secret"
  });
  await expect(secretDialog).toContainText("appsec_app-1_first");
  await savedIt(page);
  await expect(page.getByText("appsec_app-1_first")).toHaveCount(0);

  // Twilio apps run their own speech: the Speech panel goes away.
  await expect(page.getByRole("heading", { name: "Speech" })).toBeVisible();
  await choose(page, "Protocol", "Twilio");
  await expect(page.getByRole("heading", { name: "Speech" })).toHaveCount(0);
  await choose(page, "Protocol", "Fonoster");

  await choose(page, "Recording", "On after consent prompt");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("App saved")).toBeVisible();
  expect(apps.saved("app-1").recording).toBe("consent");

  // Rotate: one confirmation, no typing, and the new secret is shown once.
  await page.getByRole("button", { name: "Rotate secret" }).click();
  const rotate = page.getByRole("dialog", {
    name: "Rotate the signing secret?"
  });
  await expect(rotate.getByLabel(/Type DELETE/)).toHaveCount(0);
  await rotate.getByRole("button", { name: "Rotate" }).click();
  await expect(page.getByRole("dialog")).toContainText("appsec_app-1_rotated");
  await savedIt(page);

  await page
    .getByRole("region", { name: "Danger zone" })
    .getByRole("button", { name: "Delete app" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Type DELETE to confirm/).fill("DELETE");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/apps$/);
  expect(apps.apps.size).toBe(0);
});
