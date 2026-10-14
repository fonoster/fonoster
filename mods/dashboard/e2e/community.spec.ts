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
import { grpcError } from "./grpc-web";

test.use({ variant: "community" });

test("signs in with email and password and opens a workspace", async ({ page, api }) => {
  api.on("Identity/ExchangeCredentials", (request) => {
    const { username, password } = identity.ExchangeCredentialsRequest.deserializeBinary(request).toObject();
    return username === ada.email && password === "correct-horse"
      ? tokens(ada)
      : grpcError(7, "Invalid credentials");
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("button", { name: /GitHub/ })).toHaveCount(0);

  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid credentials")).toBeVisible();

  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Choose a workspace" })).toBeVisible();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await expect(page).toHaveURL(/\/w\/ws-1$/);

  // A reload keeps the session and returns to the remembered workspace.
  await page.goto("/");
  await expect(page).toHaveURL(/\/w\/ws-1$/);
});

test("makes an invitee set a password before anything else", async ({ page, api }) => {
  const maria = { ref: "u-maria", email: "maria@acme.com", name: "Maria", mustChangePassword: true };
  let changed = false;
  api
    .on("Identity/ExchangeCredentials", () => tokens(maria))
    .on("Identity/UpdateUser", (request) => {
      const { ref, password } = identity.UpdateUserRequest.deserializeBinary(request).toObject();
      changed = ref === maria.ref && password === "a-new-password";
      const response = new identity.UpdateUserResponse();
      response.setRef(maria.ref);
      return response;
    })
    .on("Identity/ExchangeRefreshToken", () =>
      tokens({ ...maria, mustChangePassword: !changed }, identity.ExchangeRefreshTokenResponse)
    )
    .on("Identity/ListWorkspaces", () => {
      const list = new identity.ListWorkspacesResponse();
      list.setItemsList([workspace("ws-9", "Acme Sales", "u-owner")]);
      return list;
    });

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(maria.email);
  await page.getByLabel("Password").fill("one-time-pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/set-password$/);

  await page.goto("/workspaces");
  await expect(page).toHaveURL(/\/set-password$/);

  await page.getByLabel("New password").fill("a-new-password");
  await page.getByLabel("Confirm password").fill("a-new-password");
  await page.getByRole("button", { name: "Set password and continue" }).click();
  await expect(page.getByRole("heading", { name: "Choose a workspace" })).toBeVisible();
  expect(changed).toBe(true);
});

test("signs out to a clean sign-in page", async ({ page, api }) => {
  api.on("Identity/ExchangeCredentials", () => tokens(ada));
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password").fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(await page.evaluate(() => localStorage.getItem("fonoster.session"))).toBeNull();
});
