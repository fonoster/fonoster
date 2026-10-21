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
 * The resource screens (spec change dashboard-resource-screens): every CRUD
 * operation through the UI, against an in-memory SIP network that behaves like the
 * API. Requests are read back from what the dashboard sent.
 */
import type { Page } from "@playwright/test";
import { ada, expect, identity, test, tokens } from "./fixtures";
import { applications, type GrpcWebMock } from "./grpc-web";
import {
  aclsPb,
  agentsPb,
  credentialsPb,
  domainsPb,
  lastRequest,
  numbersPb,
  SipNetwork,
  trunksPb
} from "./sipnet";
import { FakeWorkspace } from "./workspace";

test.use({ variant: "community" });

function application(ref: string, name: string, type: "AUTOPILOT" | "STREAM") {
  const app = new applications.Application();
  app.setRef(ref);
  app.setName(name);
  app.setType(applications.ApplicationType[type]);
  return app;
}

/** Signs Ada in, with the SIP network and two applications behind the API. */
async function signIn(page: Page, api: GrpcWebMock, net = new SipNetwork()) {
  net.install(api);
  api
    .on("Identity/ExchangeCredentials", () => tokens(ada))
    .on("Applications/ListApplications", () => {
      const list = new applications.ListApplicationsResponse();
      list.setItemsList([
        application("app-receptionist", "Receptionist", "AUTOPILOT"),
        application("app-ivr", "Order status", "STREAM")
      ]);
      return list;
    });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await expect(page).toHaveURL(/\/w\/ws-1$/);
  return net;
}

async function openSection(page: Page, label: string) {
  await page.getByRole("link", { name: label, exact: true }).click();
}

/** Picks `option` in the select labeled `label`. */
async function choose(
  page: Page,
  label: string | RegExp,
  option: string | RegExp
) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
}

/**
 * Opens a row's actions menu and chooses Delete, then confirms with DELETE. The
 * dialog's button says `confirm` (Remove for numbers and members).
 */
async function deleteRow(
  page: Page,
  rowLabel: string,
  confirmLabel = "Delete"
) {
  await page.getByRole("button", { name: `Actions for ${rowLabel}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", {
    name: confirmLabel,
    exact: true
  });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/Type DELETE to confirm/).fill("DELETE");
  await confirm.click();
  await expect(dialog).toBeHidden();
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

test("[DSH-017] adds a number routed to an agent, reroutes it to a SIP agent and removes it", async ({
  page,
  api
}) => {
  const net = new SipNetwork();
  net.addTrunk({
    ref: "tr-acme",
    name: "Acme",
    inboundUri: "acme.pstn.fonoster.local"
  });
  const domain = net.addDomain({
    name: "Acme HQ",
    domainUri: "acme.sip.fonoster.local"
  });
  net.addAgent({ name: "Maria", username: "maria", domainRef: domain });
  await signIn(page, api, net);
  await openSection(page, "Numbers");

  await expect(page.getByText("No numbers yet")).toBeVisible();
  await openCreate(page, "Create number");

  // Not E.164: refused in the form, nothing sent.
  await page.getByLabel("Number", { exact: true }).fill("555-0100 ext 4");
  await page.getByLabel("Name", { exact: true }).fill("Front desk");
  await page.getByRole("button", { name: "Create number" }).click();
  await expect(
    page.getByText(/Enter the number in E\.164 format/)
  ).toBeVisible();
  expect(api.callsTo("Numbers/CreateNumber")).toHaveLength(0);

  await page.getByLabel("Number", { exact: true }).fill("+1 (809) 555-0100");
  await page.getByRole("radio", { name: /Receptionist/ }).click();
  await choose(page, "Trunk", "Acme");
  await page.getByLabel("City").fill("Santo Domingo");
  await choose(page, "Country", /Dominican Republic/);
  await page.getByRole("button", { name: "Create number" }).click();
  await expect(page.getByText("Number created")).toBeVisible();

  const created = lastRequest(
    api,
    "Numbers/CreateNumber",
    numbersPb,
    "CreateNumberRequest"
  );
  expect(created).toMatchObject({
    telUrl: "tel:+18095550100",
    name: "Front desk",
    trunkRef: "tr-acme",
    appRef: "app-receptionist",
    countryIsoCode: "DO"
  });
  const row = page.getByRole("row", { name: /Front desk/ });
  await expect(row).toContainText("Receptionist");

  // Saved: the number and its location are locked; the route moves to a SIP agent.
  await row.click();
  await expect(page.getByLabel("Number", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Location")).toBeDisabled();
  await page.getByRole("radio", { name: "SIP agent" }).click();
  await page.getByRole("radio", { name: /maria/ }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Number saved")).toBeVisible();
  const updated = lastRequest(
    api,
    "Numbers/UpdateNumber",
    numbersPb,
    "UpdateNumberRequest"
  );
  expect(updated.agentAor).toBe("sip:maria@acme.sip.fonoster.local");
  expect(updated.appRef || undefined).toBeUndefined();
  await expect(row).toContainText("maria · SIP agent");

  await deleteRow(page, "+1 809 555 0100", "Remove");
  await expect(page.getByText("No numbers yet")).toBeVisible();
  expect(net.numbers.size).toBe(0);
});

test("[DSH-018] creates a trunk under pstn, refuses a taken inbound URI, and says what deleting it stops", async ({
  page,
  api
}) => {
  const net = new SipNetwork();
  net.addTrunk({
    ref: "tr-old",
    name: "Old",
    inboundUri: "taken.pstn.fonoster.local"
  });
  const acl = net.addAcl({ name: "Acme signaling", allow: ["190.80.12.0/24"] });
  await signIn(page, api, net);
  await openSection(page, "Trunks");

  await openCreate(page, "Create trunk");
  // The inbound URI follows the name as a label under pstn.<domain>.
  await page.getByLabel("Name", { exact: true }).fill("Acme Carrier");
  await expect(page.getByLabel("Inbound URI")).toHaveValue("acme-carrier");
  await page.getByLabel("Host, URI 1").fill("sip.acme.example");
  await choose(page, "Access control list", "Acme signaling");
  await page.getByRole("button", { name: "Create trunk" }).click();
  await expect(page.getByText("Trunk created")).toBeVisible();

  const created = lastRequest(
    api,
    "Trunks/CreateTrunk",
    trunksPb,
    "CreateTrunkRequest"
  );
  expect(created).toMatchObject({
    name: "Acme Carrier",
    inboundUri: "acme-carrier.pstn.fonoster.local",
    accessControlListRef: acl
  });
  expect(created.urisList).toEqual([
    expect.objectContaining({
      host: "sip.acme.example",
      port: 5060,
      transport: "UDP",
      enabled: true
    })
  ]);
  await expect(
    page.getByRole("heading", { name: "Acme Carrier" })
  ).toBeVisible();

  // Another trunk holds this URI: the field says so and the form stays.
  await page.getByLabel("Inbound URI").fill("taken");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByText("That inbound URI is taken. Pick another.")
  ).toBeVisible();
  expect(net.trunks.get("tr-old")?.inboundUri).toBe(
    "taken.pstn.fonoster.local"
  );

  // Two numbers ride on it: deleting says how many stop receiving calls.
  const ref = [...net.trunks.values()].find(
    (t) => t.name === "Acme Carrier"
  )!.ref;
  net.addNumber({
    name: "Front desk",
    telUrl: "tel:+18095550100",
    trunkRef: ref
  });
  net.addNumber({ name: "Sales", telUrl: "tel:+18095550101", trunkRef: ref });
  await page.reload();
  await expect(
    page.getByText("2 numbers ride on this trunk", { exact: false })
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(
    "2 numbers use this trunk and will stop receiving calls through it."
  );
  await dialog.getByLabel(/Type DELETE to confirm/).fill("DELETE");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/trunks$/);
  expect(net.trunks.has(ref)).toBe(false);
});

test("[DSH-019] creates a domain with an egress rule, refuses a bad pattern, and locks its URI", async ({
  page,
  api
}) => {
  const net = new SipNetwork();
  const number = net.addNumber({
    name: "Front desk",
    telUrl: "tel:+18095550100"
  });
  await signIn(page, api, net);
  await openSection(page, "Domains");

  await expect(page.getByText("No domains yet")).toBeVisible();
  await openCreate(page, "Create domain");
  await page.getByLabel("Name", { exact: true }).fill("Acme HQ");
  await page.getByLabel("Domain URI").fill("acme");
  await page.getByRole("button", { name: "Add rule" }).click();
  await page.getByLabel("Rule 1 pattern").fill("sip:+1(");
  await choose(page, "Rule 1 number", /\+18095550100/);
  await page.getByRole("button", { name: "Create domain" }).click();
  await expect(page.getByText(/Patterns can.t contain/)).toBeVisible();
  expect(api.callsTo("Domains/CreateDomain")).toHaveLength(0);

  await page.getByLabel("Rule 1 pattern").fill("^\\+1");
  await page.getByRole("button", { name: "Create domain" }).click();
  await expect(page.getByText("Domain created")).toBeVisible();
  const created = lastRequest(
    api,
    "Domains/CreateDomain",
    domainsPb,
    "CreateDomainRequest"
  );
  expect(created).toMatchObject({
    name: "Acme HQ",
    domainUri: "acme.sip.fonoster.local"
  });
  expect(created.egressPoliciesList).toEqual([
    { rule: "^\\+1", numberRef: number }
  ]);

  await page.getByRole("row", { name: /Acme HQ/ }).click();
  await expect(page.getByLabel("Domain URI")).toBeDisabled();
  await expect(
    page.getByText("The URI can't be changed. Add a new domain instead.")
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await deleteRow(page, "Acme HQ");
  await expect(page.getByText("No domains yet")).toBeVisible();
});

test("[DSH-020] creates a SIP agent, refuses invalid fields, and disables it from the list", async ({
  page,
  api
}) => {
  const net = new SipNetwork();
  const domain = net.addDomain({
    name: "Acme HQ",
    domainUri: "acme.sip.fonoster.local"
  });
  const creds = net.addCredentials({
    name: "Maria's phone",
    username: "maria"
  });
  await signIn(page, api, net);
  await openSection(page, "SIP agents");

  await openCreate(page, "Create SIP agent");
  await page.getByLabel("Name", { exact: true }).fill("Maria");
  await page.getByLabel("Username", { exact: true }).fill("Maria Perez");
  await page.getByLabel("Max contacts").fill("101");
  await page.getByRole("button", { name: "Create SIP agent" }).click();
  await expect(
    page.getByText(
      "Lowercase letters, numbers, dots, underscores and hyphens only"
    )
  ).toBeVisible();
  await expect(page.getByText("Between 1 and 100")).toBeVisible();
  await expect(page.getByText("Pick a domain")).toBeVisible();
  expect(api.callsTo("Agents/CreateAgent")).toHaveLength(0);

  await page.getByLabel("Username", { exact: true }).fill("maria");
  await page.getByLabel("Max contacts").fill("2");
  await choose(page, "Domain", /acme\.sip\.fonoster\.local/);
  await choose(page, "Credentials", /Maria's phone/);
  await page.getByRole("button", { name: "Create SIP agent" }).click();
  await expect(page.getByText("SIP agent created")).toBeVisible();
  expect(
    lastRequest(api, "Agents/CreateAgent", agentsPb, "CreateAgentRequest")
  ).toMatchObject({
    name: "Maria",
    username: "maria",
    domainRef: domain,
    credentialsRef: creds,
    maxContacts: 2,
    enabled: true
  });
  const row = page.getByRole("row", { name: /Maria/ });
  await expect(row).toContainText("sip:maria@acme.sip.fonoster.local");

  // The Enabled switch saves on its own, with no form.
  await row.getByRole("switch", { name: "Enable Maria" }).click();
  await expect.poll(() => api.callsTo("Agents/UpdateAgent").length).toBe(1);
  expect(
    lastRequest(api, "Agents/UpdateAgent", agentsPb, "UpdateAgentRequest")
      .enabled
  ).toBe(false);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // The username is fixed once created.
  await row.click();
  await expect(page.getByLabel("Username", { exact: true })).toBeDisabled();
});

test("[DSH-021] creates an ACL of addresses and ranges and refuses anything else", async ({
  page,
  api
}) => {
  await signIn(page, api);
  await openSection(page, "ACLs");

  await expect(
    page.getByText("Anything not listed is rejected.", { exact: false })
  ).toBeVisible();
  await openCreate(page, "Create ACL");
  await page.getByLabel("Name", { exact: true }).fill("Acme signaling");
  await page
    .getByLabel("Allowed address 1", { exact: true })
    .fill("10.0.0.0/33");
  await page.getByRole("button", { name: "Add address" }).click();
  await page
    .getByLabel("Allowed address 2", { exact: true })
    .fill("carrier.example");
  await page.getByRole("button", { name: "Create ACL" }).click();
  await expect(
    page.getByText("Use an IPv4 address or range, like 10.0.0.0/16")
  ).toHaveCount(2);
  expect(api.callsTo("Acls/CreateAcl")).toHaveLength(0);

  await page
    .getByLabel("Allowed address 1", { exact: true })
    .fill("190.80.12.0/24");
  await page.getByLabel("Allowed address 2", { exact: true }).fill("10.0.0.5");
  await page.getByRole("button", { name: "Create ACL" }).click();
  await expect(page.getByText("ACL created")).toBeVisible();
  expect(
    lastRequest(api, "Acls/CreateAcl", aclsPb, "CreateAclRequest")
  ).toMatchObject({
    name: "Acme signaling",
    allowList: ["190.80.12.0/24", "10.0.0.5"]
  });

  await deleteRow(page, "Acme signaling");
  await expect(page.getByText("No ACLs yet")).toBeVisible();
});

test("[DSH-022] keeps credentials' passwords write-only", async ({
  page,
  api
}) => {
  await signIn(page, api);
  await openSection(page, "Credentials");

  await openCreate(page, "Create credentials");
  await page.getByLabel("Name", { exact: true }).fill("Acme trunk");
  await page.getByLabel("Username", { exact: true }).fill("acme");
  await page.getByLabel("Password", { exact: true }).fill("s3cret-pass");
  await page.getByRole("button", { name: "Create credentials" }).click();
  await expect(page.getByText("Credentials created")).toBeVisible();
  expect(
    lastRequest(
      api,
      "CredentialsService/CreateCredentials",
      credentialsPb,
      "CreateCredentialsRequest"
    )
  ).toMatchObject({
    name: "Acme trunk",
    username: "acme",
    password: "s3cret-pass"
  });

  // Editing never shows the password; an empty New password keeps it.
  await page.getByRole("row", { name: /Acme trunk/ }).click();
  await expect(page.getByLabel("New password")).toHaveValue("");
  await expect(page.getByText("s3cret-pass")).toHaveCount(0);
  await page.getByLabel("Name", { exact: true }).fill("Acme trunk (main)");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Credentials saved")).toBeVisible();
  const updated = lastRequest(
    api,
    "CredentialsService/UpdateCredentials",
    credentialsPb,
    "UpdateCredentialsRequest"
  );
  expect(updated.name).toBe("Acme trunk (main)");
  expect(updated.password || undefined).toBeUndefined();
});

test("[DSH-023] creates a secret, never shows its value, keeps a refused save in the form, and deletes it", async ({
  page,
  api
}) => {
  const net = await signIn(page, api);
  await openSection(page, "Secrets");

  await expect(page.getByText("No secrets yet")).toBeVisible();
  await openCreate(page, "Create secret");
  await page.getByLabel("Name", { exact: true }).fill("ab");
  await page.getByLabel("Value").fill("tok_live_123");
  await page.getByRole("button", { name: "Create secret" }).click();
  await expect(page.getByText("Use at least 3 characters")).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("CRM API TOKEN");
  await page.getByRole("button", { name: "Create secret" }).click();
  await expect(
    page.getByText("Letters, numbers, underscores and hyphens only")
  ).toBeVisible();
  expect(api.callsTo("Secrets/CreateSecret")).toHaveLength(0);

  // The API refuses: its message stays in the open form and the list doesn't change.
  net.failNext(
    "Secrets/CreateSecret",
    6,
    "A secret named CRM_API_TOKEN already exists"
  );
  await page.getByLabel("Name", { exact: true }).fill("CRM_API_TOKEN");
  await page.getByRole("button", { name: "Create secret" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("A secret named CRM_API_TOKEN already exists")
  ).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "CRM_API_TOKEN"
  );
  expect(net.secrets.size).toBe(0);

  await page.getByRole("button", { name: "Create secret" }).click();
  await expect(page.getByText("Secret created")).toBeVisible();
  await expect(page.getByRole("row", { name: /CRM_API_TOKEN/ })).toBeVisible();
  await expect(page.getByText("tok_live_123")).toHaveCount(0);

  await page.getByRole("row", { name: /CRM_API_TOKEN/ }).click();
  await expect(page.getByLabel("New value")).toHaveValue("");
  await page.keyboard.press("Escape");

  await deleteRow(page, "CRM_API_TOKEN");
  await expect(page.getByText("No secrets yet")).toBeVisible();
});

/** Signs Ada in to a workspace whose keys, webhooks and members the fake keeps. */
async function signInTo(page: Page, api: GrpcWebMock, ws: FakeWorkspace) {
  ws.install(api);
  return signIn(page, api);
}

/** Ticks "I've saved it" and closes a show-once secret dialog. */
async function savedIt(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("I've saved it").check();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
}

test("[DSH-024] shows an API key's secret once, regenerates it in one click, and deletes it", async ({
  page,
  api
}) => {
  const ws = new FakeWorkspace("ws-1", "Acme Support", ada.ref);
  await signInTo(page, api, ws);
  await openSection(page, "API keys");

  await expect(page.getByText("No API keys yet")).toBeVisible();
  await openCreate(page, "Create API key");
  await choose(page, "Expires", "In 90 days");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create API key" })
    .click();

  const created = lastRequest(
    api,
    "Identity/CreateApiKey",
    identity,
    "CreateApiKeyRequest"
  );
  expect(created.role).toBe("WORKSPACE_ADMIN");
  expect(created.expiresAt).toBeGreaterThan(Date.now() / 1000 + 89 * 86400);
  const key = [...ws.apiKeys.values()][0];
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("This is the only time we'll show it.");
  await expect(dialog).toContainText(key.secret);
  await savedIt(page);
  await expect(
    page.getByRole("row", { name: new RegExp(key.accessKeyId) })
  ).toBeVisible();
  await expect(page.getByText(key.secret)).toHaveCount(0);

  // Regenerate: one confirmation, no typing, and the new secret is shown once.
  await page
    .getByRole("button", { name: `Actions for ${key.accessKeyId}` })
    .click();
  await page.getByRole("menuitem", { name: "Regenerate" }).click();
  await expect(page.getByRole("dialog").getByLabel(/Type DELETE/)).toHaveCount(
    0
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Regenerate" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    `regenerated-${key.ref}`
  );
  await savedIt(page);

  await deleteRow(page, key.accessKeyId);
  await expect(page.getByText("No API keys yet")).toBeVisible();
  expect(ws.apiKeys.size).toBe(0);
});

test("[DSH-025] creates a webhook on HTTPS only, shows its secret once, and rotates it", async ({
  page,
  api
}) => {
  const ws = new FakeWorkspace("ws-1", "Acme Support", ada.ref);
  await signInTo(page, api, ws);
  await openSection(page, "Webhooks");

  await openCreate(page, "Create webhook");
  await page.getByLabel("URL").fill("http://hooks.acme.example/fonoster");
  await page.getByRole("button", { name: "Create webhook" }).last().click();
  await expect(page.getByText("Webhook URLs must use https://")).toBeVisible();
  expect(api.callsTo("Webhooks/CreateWebhook")).toHaveLength(0);

  await page.getByLabel("URL").fill("https://hooks.acme.example/fonoster");
  await page.getByLabel("Call record sealed").check();
  await page.getByRole("button", { name: "Create webhook" }).last().click();
  const hook = [...ws.webhooks.values()][0];
  expect(hook.events.sort()).toEqual(["call.ended", "call_record.sealed"]);
  await expect(page.getByRole("dialog")).toContainText(hook.secret);
  await savedIt(page);
  await expect(page.getByText(hook.secret)).toHaveCount(0);
  const row = page.getByRole("row", { name: /hooks\.acme\.example/ });
  await expect(row).toContainText("call.ended, call_record.sealed");

  // Rotate: one confirmation that says the old secret keeps verifying for 24 hours.
  await page
    .getByRole("button", {
      name: "Actions for https://hooks.acme.example/fonoster"
    })
    .click();
  await page.getByRole("menuitem", { name: "Rotate secret" }).click();
  const confirm = page.getByRole("dialog", {
    name: "Rotate the signing secret?"
  });
  await expect(confirm).toContainText(
    "The previous secret keeps verifying for 24 hours"
  );
  await expect(confirm.getByLabel(/Type DELETE/)).toHaveCount(0);
  await confirm.getByRole("button", { name: "Rotate" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    `whsec_rotated_${hook.ref}`
  );
  await savedIt(page);
});

test("[DSH-026] invites a member with a role and removes one", async ({
  page,
  api
}) => {
  const ws = new FakeWorkspace("ws-1", "Acme Support", ada.ref);
  ws.addMember({
    userRef: ada.ref,
    name: ada.name,
    email: ada.email,
    role: "WORKSPACE_OWNER",
    status: "ACTIVE"
  });
  ws.addMember({
    userRef: "u-bob",
    name: "Bob",
    email: "bob@acme.com",
    role: "WORKSPACE_MEMBER",
    status: "ACTIVE"
  });
  await signInTo(page, api, ws);
  await openSection(page, "Settings");
  await page.getByRole("link", { name: "Members" }).click();

  // The owner can't be removed: no actions on that row (once the list has loaded).
  await expect(
    page.getByRole("row", { name: new RegExp(ada.name) })
  ).toContainText("Owner");
  await expect(
    page.getByRole("button", { name: `Actions for ${ada.name}` })
  ).toHaveCount(0);

  await openCreate(page, "Invite member");
  await page.getByLabel("Name", { exact: true }).fill("Maria");
  await page.getByLabel("Email").fill("maria@acme.com");
  await choose(page, "Role", "Admin");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(
    page.getByRole("region", { name: /Notifications/ }).getByText("Invite sent")
  ).toBeVisible();
  expect(
    lastRequest(
      api,
      "Identity/InviteUserToWorkspace",
      identity,
      "InviteUserToWorkspaceRequest"
    )
  ).toMatchObject({
    name: "Maria",
    email: "maria@acme.com",
    role: "WORKSPACE_ADMIN"
  });
  await expect(page.getByRole("row", { name: /Maria/ })).toContainText(
    "Invite sent"
  );

  await page.getByRole("button", { name: "Actions for Bob" }).click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  const dialog = page.getByRole("dialog");
  const remove = dialog.getByRole("button", { name: "Remove", exact: true });
  await expect(remove).toBeDisabled();
  await dialog.getByLabel(/Type DELETE to confirm/).fill("DELETE");
  await remove.click();
  await expect(page.getByText("Member removed")).toBeVisible();
  await expect(page.getByRole("row", { name: /Bob/ })).toHaveCount(0);
});

test("[DSH-027] renames the workspace and deletes it only after its name is typed", async ({
  page,
  api
}) => {
  const ws = new FakeWorkspace("ws-1", "Acme Support", ada.ref);
  await signInTo(page, api, ws);
  await openSection(page, "Settings");

  await expect(page.getByLabel("Access key ID", { exact: true })).toContainText(
    "WOws-1"
  );
  await page.getByLabel("Workspace name").fill("Acme Sales");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Workspace saved")).toBeVisible();
  expect(ws.name).toBe("Acme Sales");
  await expect(
    page.getByRole("button", { name: /Workspace: Acme Sales/ })
  ).toBeVisible();

  await page
    .getByRole("region", { name: "Danger zone" })
    .getByRole("button")
    .click();
  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", { name: "Delete workspace" });
  await dialog.getByLabel('Type "Acme Sales" to confirm').fill("DELETE");
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Type "Acme Sales" to confirm').fill("Acme Sales");
  await confirm.click();
  await expect(page.getByText("Workspace deleted")).toBeVisible();
  expect(ws.deleted).toBe(true);
  await expect(page).not.toHaveURL(/\/w\//);
  await expect(page.getByRole("link", { name: /Acme Sales/ })).toHaveCount(0);
});
