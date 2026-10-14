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
import { ada, expect, identity, test, tokens } from "./fixtures";

test.use({ variant: "cloud" });

test("signs in with an emailed code", async ({ page, api }) => {
  api.on("Identity/ExchangeVerificationCode", (request) => {
    const { email, code } = identity.ExchangeVerificationCodeRequest.deserializeBinary(request).toObject();
    expect({ email, code }).toEqual({ email: ada.email, code: "482913" });
    return tokens(ada, identity.ExchangeVerificationCodeResponse);
  });

  await page.goto("/sign-in");
  await expect(page.getByLabel("Password")).toHaveCount(0);
  await page.getByLabel("Work email").fill(ada.email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  expect(api.callsTo("Identity/SendVerificationCode")).toHaveLength(1);

  await page.getByLabel("Sign-in code").fill("482913");
  await expect(page.getByRole("heading", { name: "Choose a workspace" })).toBeVisible();
});

test("signs in with GitHub and checks the state", async ({ page, api }) => {
  api.on("Identity/ExchangeOauth2Code", (request) => {
    const { code } = identity.ExchangeOauth2CodeRequest.deserializeBinary(request).toObject();
    expect(code).toBe("gh-code");
    return tokens(ada, identity.ExchangeOauth2CodeResponse);
  });
  // Stand in for GitHub: approve at once and return to the callback.
  await page.route("https://github.com/login/oauth/authorize**", (route) => {
    const url = new URL(route.request().url());
    const back = new URL(url.searchParams.get("redirect_uri")!);
    back.searchParams.set("code", "gh-code");
    back.searchParams.set("state", url.searchParams.get("state")!);
    return route.fulfill({ status: 302, headers: { location: back.toString() } });
  });

  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue with GitHub" }).click();
  await expect(page.getByRole("heading", { name: "Choose a workspace" })).toBeVisible();
});

test("refuses a GitHub callback it didn't start", async ({ page, api }) => {
  await page.goto("/oauth/github/callback?code=stolen&state=forged");
  await expect(page.getByRole("heading", { name: "Couldn't sign in with GitHub" })).toBeVisible();
  expect(api.callsTo("Identity/ExchangeOauth2Code")).toHaveLength(0);
});
