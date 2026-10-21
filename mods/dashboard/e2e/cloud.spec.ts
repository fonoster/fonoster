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
import { ada, expect, identity, test, tokens, withPrivateRegion } from "./fixtures";
import { grpcError } from "./grpc-web";

test.use({ variant: "cloud" });

test("[DSH-016] signs in with email and password on Cloud", async ({
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

  await page.goto("/sign-in");
  // Cloud offers all three: GitHub, then the password form, with the code as an alternative.
  await expect(
    page.getByRole("button", { name: "Continue with GitHub" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Email me a sign-in code instead" })
  ).toBeVisible();
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid credentials")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
});

test("[DSH-006] signs in with an emailed code", async ({ page, api }) => {
  api.on("Identity/ExchangeVerificationCode", (request) => {
    const { email, code } =
      identity.ExchangeVerificationCodeRequest.deserializeBinary(
        request
      ).toObject();
    expect({ email, code }).toEqual({ email: ada.email, code: "482913" });
    return tokens(ada, identity.ExchangeVerificationCodeResponse);
  });

  await page.goto("/sign-in");
  // The password form comes first; the code is one link away.
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Email me a sign-in code instead" })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page.getByLabel("Work email").fill(ada.email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your email" })
  ).toBeVisible();
  expect(api.callsTo("Identity/SendVerificationCode")).toHaveLength(1);

  await page.getByLabel("Sign-in code").fill("482913");
  await expect(page).toHaveURL(/\/workspaces$/);
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
});

test("[DSH-007] signs in with GitHub and checks the state", async ({
  page,
  api
}) => {
  api.on("Identity/ExchangeOauth2Code", (request) => {
    const { code } =
      identity.ExchangeOauth2CodeRequest.deserializeBinary(request).toObject();
    expect(code).toBe("gh-code");
    return tokens(ada, identity.ExchangeOauth2CodeResponse);
  });
  // Stand in for GitHub: approve at once and return to the callback.
  await page.route("https://github.com/login/oauth/authorize**", (route) => {
    const url = new URL(route.request().url());
    const back = new URL(url.searchParams.get("redirect_uri")!);
    back.searchParams.set("code", "gh-code");
    back.searchParams.set("state", url.searchParams.get("state")!);
    return route.fulfill({
      status: 302,
      headers: { location: back.toString() }
    });
  });

  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue with GitHub" }).click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
});

test("[DSH-008] refuses a GitHub callback it didn't start", async ({
  page,
  api
}) => {
  await page.goto("/oauth/github/callback?code=stolen&state=forged");
  await expect(
    page.getByRole("heading", { name: "Couldn't sign in with GitHub" })
  ).toBeVisible();
  expect(api.callsTo("Identity/ExchangeOauth2Code")).toHaveLength(0);
});

test("[DSH-009] never reveals whether an email has an account", async ({
  page,
  api
}) => {
  // The server refuses the exchange and, in this mock, even says why; the screen must not repeat it.
  api.on("Identity/ExchangeVerificationCode", () =>
    grpcError(7, "No account for nobody@acme.com")
  );

  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: "Email me a sign-in code instead" })
    .click();
  await page.getByLabel("Work email").fill("nobody@acme.com");
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  // Asking for a code looks the same for any email.
  await expect(
    page.getByRole("heading", { name: "Check your email" })
  ).toBeVisible();

  await page.getByLabel("Sign-in code").fill("000000");
  await expect(page.getByText(/That code isn't valid/)).toBeVisible();
  // The screen may echo the address the user typed; it must never say the account is missing.
  await expect(page.getByText(/no account|not found|unknown email/i)).toHaveCount(0);
});

test("[DSH-013] a private region shows its monthly fee on Cloud", async ({
  page,
  api
}) => {
  api.on("Identity/ExchangeCredentials", () => tokens(ada));
  await withPrivateRegion(page, api, "cloud", {
    ref: "rg_7K2QF",
    id: "acme-dallas",
    displayName: "Acme Dallas",
    monthlyFeeCents: 2500000
  });

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "More for Acme Dallas" }).click();
  await expect(page.getByText("Monthly fee")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(/\$25,000/);
});
