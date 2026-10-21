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
import { expect, test, type Page } from "@playwright/test";

// The `real` project against the running platform (ops/rebuild/stack up && seed): the SIP
// network built through the UI against the apiserver and Routr, then taken down again. Names
// are unique per run so the seeded Demo resources and Routr's unique names are never touched.
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run npm run test:e2e:real`);
  return value;
};

const run = String(Date.now()).slice(-6);
const label = `e2e-${run}`;

/** Deletes anything this run left behind, through the SDK, if a UI step failed midway. */
async function cleanUp() {
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SDK = require("@fonoster/sdk");
  const port = new URL(env("E2E_REAL_API_URL")).port;
  const client = new SDK.Client({
    accessKeyId: env("E2E_REAL_WORKSPACE_KEY"),
    endpoint: `localhost:${port}`,
    allowInsecure: true
  });
  await client.login(env("E2E_REAL_EMAIL"), env("E2E_REAL_PASSWORD"));
  const sweep = async (
    service: {
      [k: string]: (
        r: unknown
      ) => Promise<{ items: { ref: string; name: string }[] }>;
    },
    list: string,
    remove: string
  ) => {
    const { items } = await service[list]({ pageSize: 100 });
    for (const item of items.filter((i) => i.name?.startsWith(label)))
      await service[remove](item.ref).catch(() => undefined);
  };
  await sweep(new SDK.Numbers(client), "listNumbers", "deleteNumber");
  await sweep(new SDK.Trunks(client), "listTrunks", "deleteTrunk");
  await sweep(new SDK.Agents(client), "listAgents", "deleteAgent");
  await sweep(new SDK.Domains(client), "listDomains", "deleteDomain");
  await sweep(new SDK.Acls(client), "listAcls", "deleteAcl");
  await sweep(
    new SDK.Credentials(client),
    "listCredentials",
    "deleteCredentials"
  );
}

test.afterEach(async () => {
  await cleanUp().catch((e) =>
    console.warn(`cleanup: ${(e as Error).message}`)
  );
});

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

async function choose(page: Page, label: string, option: string | RegExp) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
}

async function deleteRow(
  page: Page,
  rowLabel: string,
  confirmLabel = "Delete"
) {
  await page.getByRole("button", { name: `Actions for ${rowLabel}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Type DELETE to confirm/).fill("DELETE");
  await dialog.getByRole("button", { name: confirmLabel, exact: true }).click();
  await expect(dialog).toBeHidden();
}

test("[DSH-041] builds a SIP network through the UI against the platform, then takes it down", async ({
  page
}) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.getByLabel("Email").fill(env("E2E_REAL_EMAIL"));
  await page
    .getByLabel("Password", { exact: true })
    .fill(env("E2E_REAL_PASSWORD"));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: env("E2E_REAL_WORKSPACE") }).click();
  const sidebar = page.getByRole("complementary", { name: "Main" });
  const section = (name: string) =>
    sidebar.getByRole("link", { name, exact: true }).click();

  // Credentials, a domain, a SIP agent on it, an ACL, a trunk and a number on the trunk.
  await section("Credentials");
  await openCreate(page, "Create credentials");
  await page.getByLabel("Name", { exact: true }).fill(`${label} phone`);
  await page.getByLabel("Username", { exact: true }).fill(label);
  await page.getByLabel("Password", { exact: true }).fill(`pw-${run}-secret`);
  await page.getByRole("button", { name: "Create credentials" }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(`${label} phone`) })
  ).toBeVisible();

  await section("Domains");
  await openCreate(page, "Create domain");
  await page.getByLabel("Name", { exact: true }).fill(`${label} domain`);
  await page.getByLabel("Domain URI").fill(label);
  await page.getByRole("button", { name: "Create domain" }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(`${label} domain`) })
  ).toBeVisible();

  await section("SIP agents");
  await openCreate(page, "Create SIP agent");
  await page.getByLabel("Name", { exact: true }).fill(`${label} agent`);
  await page.getByLabel("Username", { exact: true }).fill(label);
  await choose(page, "Domain", new RegExp(`^${label}\\.sip\\.`));
  await choose(page, "Credentials", new RegExp(`${label} phone`));
  await page.getByRole("button", { name: "Create SIP agent" }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(`${label} agent`) })
  ).toContainText(new RegExp(`sip:${label}@${label}\\.sip\\.`));

  await section("ACLs");
  await openCreate(page, "Create ACL");
  await page.getByLabel("Name", { exact: true }).fill(`${label} acl`);
  await page
    .getByLabel("Allowed address 1", { exact: true })
    .fill("10.20.30.0/24");
  await page.getByRole("button", { name: "Create ACL" }).click();
  await expect(
    page.getByRole("row", { name: new RegExp(`${label} acl`) })
  ).toBeVisible();

  await section("Trunks");
  await openCreate(page, "Create trunk");
  await page.getByLabel("Name", { exact: true }).fill(`${label} trunk`);
  await page.getByLabel("Host, URI 1").fill("sip.acme.example");
  await choose(page, "Access control list", new RegExp(`${label} acl`));
  await page.getByRole("button", { name: "Create trunk" }).click();
  await expect(
    page.getByRole("heading", { name: `${label} trunk` })
  ).toBeVisible();

  await section("Numbers");
  const tel = `+1555${run}`;
  await openCreate(page, "Create number");
  await page.getByLabel("Number", { exact: true }).fill(tel);
  await page.getByLabel("Name", { exact: true }).fill(`${label} number`);
  await page
    .getByRole("radio", { name: new RegExp(env("E2E_REAL_APP")) })
    .click();
  await choose(page, "Trunk", new RegExp(`${label} trunk`));
  await page.getByLabel("City").fill("Santo Domingo");
  await choose(page, "Country", /Dominican Republic/);
  await page.getByRole("button", { name: "Create number" }).click();
  const numberRow = page.getByRole("row", {
    name: new RegExp(`${label} number`)
  });
  await expect(numberRow).toContainText(env("E2E_REAL_APP"));

  // A reload reads it all back from the platform.
  await page.reload();
  await expect(numberRow).toContainText(env("E2E_REAL_APP"));

  // Down again, in reverse.
  await deleteRow(
    page,
    (await numberRow
      .getByRole("button")
      .first()
      .getAttribute("aria-label"))!.replace("Actions for ", ""),
    "Remove"
  );
  await expect(numberRow).toHaveCount(0);
  await section("Trunks");
  await deleteRow(page, `${label} trunk`);
  await section("ACLs");
  await deleteRow(page, `${label} acl`);
  await section("SIP agents");
  await deleteRow(page, `${label} agent`);
  await section("Domains");
  await deleteRow(page, `${label} domain`);
  await section("Credentials");
  await deleteRow(page, `${label} phone`);
  await expect(page.getByRole("row", { name: new RegExp(label) })).toHaveCount(
    0
  );
});
