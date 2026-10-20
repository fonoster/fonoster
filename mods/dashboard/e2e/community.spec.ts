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
import { ada, expect, identity, test, tokens, workspace } from "./fixtures";
import {
  applications,
  callRecord,
  calls,
  grpcError,
  numbers,
  struct
} from "./grpc-web";

test.use({ variant: "community" });

test("signs in with email and password and opens a workspace", async ({
  page,
  api
}) => {
  api.on("Identity/ExchangeCredentials", (request) => {
    const { username, password } =
      identity.ExchangeCredentialsRequest.deserializeBinary(request).toObject();
    return username === ada.email && password === "correct-horse"
      ? tokens(ada)
      : grpcError(7, "Invalid credentials");
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("button", { name: /GitHub/ })).toHaveCount(0);

  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid credentials")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await expect(page).toHaveURL(/\/w\/ws-1$/);

  // The refresh token went to the cookie session, not to storage.
  expect(api.callsTo("session/adopt")).toHaveLength(1);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toMatch(
    /refresh|[\w-]+\.[\w-]+\.e2e/
  );

  // A reload restores the session from the cookie and returns to the remembered workspace.
  await page.goto("/");
  await expect(page).toHaveURL(/\/w\/ws-1$/);
  expect(api.callsTo("session/refresh").length).toBeGreaterThan(0);
});

test("makes an invitee set a password before anything else", async ({
  page,
  api
}) => {
  const maria = {
    ref: "u-maria",
    email: "maria@acme.com",
    name: "Maria",
    mustChangePassword: true
  };
  let changed = false;
  api
    // After the change the dashboard signs in again with the new password (M3).
    .on("Identity/ExchangeCredentials", () =>
      tokens({ ...maria, mustChangePassword: !changed })
    )
    .on("Identity/UpdateUser", (request) => {
      const { ref, password, currentPassword } =
        identity.UpdateUserRequest.deserializeBinary(request).toObject();
      changed =
        ref === maria.ref &&
        password === "a-new-password" &&
        currentPassword === "one-time-pw";
      const response = new identity.UpdateUserResponse();
      response.setRef(maria.ref);
      return response;
    })
    .on("Identity/ExchangeRefreshToken", () =>
      tokens(
        { ...maria, mustChangePassword: !changed },
        identity.ExchangeRefreshTokenResponse
      )
    )
    .on("Identity/ListWorkspaces", () => {
      const list = new identity.ListWorkspacesResponse();
      list.setItemsList([workspace("ws-9", "Acme Sales", "u-owner")]);
      return list;
    });

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(maria.email);
  await page.getByLabel("Password", { exact: true }).fill("one-time-pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/set-password$/);

  await page.goto("/workspaces");
  await expect(page).toHaveURL(/\/set-password$/);

  await page.getByLabel("One-time password").fill("one-time-pw");
  await page.getByLabel("New password", { exact: true }).fill("a-new-password");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("a-new-password");
  await page.getByRole("button", { name: "Set password and continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
  expect(changed).toBe(true);
});

test("signs out to a clean sign-in page", async ({ page, api }) => {
  api.on("Identity/ExchangeCredentials", () => tokens(ada));
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(
    await page.evaluate(() => localStorage.getItem("fonoster.session"))
  ).toBeNull();
  // Nothing token-like in storage at any point; sign-out revoked the cookie session (M4).
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toMatch(
    /refresh|[\w-]+\.[\w-]+\.e2e/
  );
  // Sign-out doesn't wait for the revoke, so the call can land just after the redirect.
  await expect.poll(() => api.callsTo("session/logout")).toHaveLength(1);
});

// Runs the real SDK decoding on an application, Struct configs included
// (regression: "textToSpeech.config.toJavaScript is not a function").
test("lists and opens an agent with its saved configuration", async ({
  page,
  api
}) => {
  const product = (productRef: string, config: object) => {
    const container = new applications.ProductContainer();
    container.setProductRef(productRef);
    container.setConfig(struct.Struct.fromJavaScript(config));
    return container;
  };
  const agent = new applications.Application();
  agent.setRef("ap-1");
  agent.setName("Front desk");
  agent.setType(applications.ApplicationType.AUTOPILOT);
  agent.setTextToSpeech(product("tts.deepgram", { voice: "aura-2-thalia-en" }));
  agent.setSpeechToText(
    product("stt.deepgram", { model: "nova-3", languageCode: "en-US" })
  );
  agent.setIntelligence(
    product("llm.openai", {
      conversationSettings: {
        firstMessage: "Hi, how can I help?",
        systemPrompt: "You are a receptionist.",
        goodbyeMessage: "Bye",
        systemErrorMessage: "Sorry",
        idleOptions: {
          message: "Still there?",
          timeout: 10000,
          maxTimeoutCount: 2
        }
      },
      languageModel: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.4,
        maxTokens: 240,
        tools: []
      }
    })
  );
  api
    .on("Identity/ExchangeCredentials", () => tokens(ada))
    .on("Applications/ListApplications", () => {
      const list = new applications.ListApplicationsResponse();
      list.setItemsList([agent]);
      return list;
    })
    .on("Applications/GetApplication", () => agent)
    .on("Numbers/ListNumbers", () => new numbers.ListNumbersResponse());

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await page.getByRole("link", { name: "Agents", exact: true }).click();

  await expect(page.getByText("Front desk")).toBeVisible();
  await expect(page.getByText(/gpt-4o-mini/)).toBeVisible();
  await page.getByText("Front desk").click();
  await expect(page.getByLabel("System prompt")).toHaveValue(
    "You are a receptionist."
  );
  await expect(page.getByLabel("First message")).toHaveValue(
    "Hi, how can I help?"
  );
});

// Runs the real SDK decoding on call records: epoch seconds, enum numbers.
// The Calls screen now reads call records from /api/records (rebuild: control, CP-B9);
// these gRPC-mocked flows need an HTTP mock before they come back.
test.skip("lists calls, filters by status on the server and opens one", async ({
  page,
  api
}) => {
  const now = Math.floor(Date.now() / 1000);
  const answered = callRecord({
    ref: "cl-9b21e7",
    from: "+18295550199",
    to: "+18295550110",
    startedAt: now - 600,
    duration: 24,
    direction: "TO_PSTN",
    status: "NORMAL_CLEARING",
    amdStatus: "HUMAN"
  });
  const busy = callRecord({
    ref: "cl-4c8e2a",
    from: "+18095550142",
    to: "+18295550199",
    startedAt: now - 1200,
    duration: 0,
    direction: "FROM_PSTN",
    status: "USER_BUSY"
  });
  api
    .on("Identity/ExchangeCredentials", () => tokens(ada))
    .on("Calls/ListCalls", (request) => {
      const { status } =
        calls.ListCallsRequest.deserializeBinary(request).toObject();
      const list = new calls.ListCallsResponse();
      list.setItemsList(
        status === calls.CallStatus.USER_BUSY ? [busy] : [answered, busy]
      );
      return list;
    })
    .on("Calls/GetCall", () => answered);

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await page.getByRole("link", { name: "Calls" }).click();

  const table = page.getByRole("table", { name: "Calls" });
  await expect(table.getByText("+1 829 555 0110")).toBeVisible();
  await expect(table.getByText("0:24")).toBeVisible();
  await expect(table.getByText("Human")).toBeVisible();
  await expect(table.getByText("Busy")).toBeVisible();

  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Busy" }).click();
  await expect(page).toHaveURL(/status=USER_BUSY/);
  await expect(table.getByText("+1 829 555 0110")).toHaveCount(0);
  await expect(table.getByText("+1 809 555 0142")).toBeVisible();

  await page.goto("/w/ws-1/calls/cl-9b21e7");
  await expect(
    page.getByRole("heading", { name: /\+1 829 555 0110/ })
  ).toBeVisible();
  await expect(page.getByText("Answered by human")).toBeVisible();
  await expect(page.getByRole("region", { name: "Cost" })).toHaveCount(0);
});
