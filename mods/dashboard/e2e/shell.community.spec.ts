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
 * The shell around the screens: how the dashboard boots (its runtime config and the API's
 * capabilities), the session an older version left behind, the sidebar and its paths.
 */
import type { Page } from "@playwright/test";
import { ada, capabilitiesFor, expect, test, tokens } from "./fixtures";
import { applications, grpcError, type GrpcWebMock } from "./grpc-web";

test.use({ variant: "community" });

async function signIn(page: Page, api: GrpcWebMock) {
  api.on("Identity/ExchangeCredentials", () => tokens(ada));
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
}

test("[DSH-046] says the API can't be reached at boot, shows no sign-in, and retries", async ({
  page,
  api
}) => {
  let reachable = false;
  api.on("Capabilities/GetCapabilities", () =>
    reachable ? capabilitiesFor("community") : grpcError(14, "unavailable")
  );

  await page.goto("/sign-in");
  await expect(
    page.getByRole("heading", { name: "Can't reach the Fonoster API" })
  ).toBeVisible();
  // It names the configured URL (public/config.js in this build).
  await expect(page.getByText("http://localhost:8449")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);

  // The API comes back: Try again asks once more and the sign-in form appears.
  reachable = true;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByLabel("Email")).toBeVisible();
  expect(api.callsTo("Capabilities/GetCapabilities")).toHaveLength(2);
});

test("[DSH-047] names DASHBOARD_API_URL when the image started without it", async ({
  page,
  api
}) => {
  // What nginx/40-fonoster-config.sh writes when DASHBOARD_API_URL is empty.
  await page.route("**/config.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.__FONOSTER__ = undefined;\n"
    })
  );

  await page.goto("/sign-in");
  await expect(
    page.getByRole("heading", { name: "The dashboard isn't configured" })
  ).toBeVisible();
  await expect(page.getByText("DASHBOARD_API_URL is not set")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveCount(0);
  // Nothing was asked of an API it doesn't know.
  expect(api.callsTo("Capabilities/GetCapabilities")).toHaveLength(0);
});

test("[DSH-048] the sidebar collapses to icons with tooltips and stays collapsed after a reload", async ({
  page,
  api
}) => {
  api.on("Applications/ListApplications", () => {
    const list = new applications.ListApplicationsResponse();
    list.setItemsList([]);
    return list;
  });
  await signIn(page, api);
  await page.goto("/w/ws-1/agents");
  const sidebar = page.getByRole("complementary", { name: "Main" });
  const agents = sidebar.getByRole("link", { name: "Agents", exact: true });

  // A rail until the user expands it; expanded, the items read as text.
  await sidebar.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(agents).toHaveText("Agents");

  await sidebar.getByRole("button", { name: "Collapse sidebar" }).click();
  const collapsed = async () => {
    await expect(
      sidebar.getByRole("button", { name: "Expand sidebar" })
    ).toBeVisible();
    // Icons only: every item still reachable by its name, the label shown as a tooltip.
    await expect(agents).toHaveText("");
    await agents.hover();
    await expect(page.getByRole("tooltip", { name: "Agents" })).toBeVisible();
    // The bubble mark, not the wordmark, and the workspace's avatar.
    await expect(
      sidebar.getByRole("link", { name: "All workspaces" })
    ).toBeVisible();
    await expect(sidebar.getByText("AS", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Acme Support")).toHaveCount(0);
  };
  await collapsed();

  // The choice is remembered by this browser.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  await collapsed();
});

test("[DSH-049] moves an older version's stored session into the cookie and deletes it", async ({
  page,
  api
}) => {
  // What an older dashboard left in localStorage, present on the first load only.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("e2e.seeded")) return;
    sessionStorage.setItem("e2e.seeded", "1");
    localStorage.setItem(
      "fonoster.session",
      JSON.stringify({
        accessToken: "old.access.e2e",
        idToken: "old.id.e2e",
        refreshToken: "refresh-from-older-version"
      })
    );
  });
  const adopted: unknown[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/session"
    )
      adopted.push(request.postDataJSON()?.refreshToken);
  });

  await page.goto("/");
  // Signed in from the moved token, without the sign-in form.
  await expect(
    page.getByRole("heading", { name: "Choose a workspace" })
  ).toBeVisible();
  expect(adopted).toEqual(["refresh-from-older-version"]);
  expect(api.callsTo("session/adopt")).toHaveLength(1);
  expect(api.callsTo("Identity/ExchangeCredentials")).toHaveLength(0);
  expect(
    await page.evaluate(() => localStorage.getItem("fonoster.session"))
  ).toBeNull();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toMatch(
    /refresh|[\w-]+\.[\w-]+\.e2e/
  );
});

test("[DSH-050] old section paths aren't redirected: they go to the workspace's Overview", async ({
  page,
  api
}) => {
  await signIn(page, api);
  for (const old of ["streams", "autopilot", "sip-users"]) {
    await page.goto(`/w/ws-1/${old}`);
    await expect(page).toHaveURL(/\/w\/ws-1$/);
    await expect(
      page.getByRole("heading", {
        name: /^(Overview|Welcome to Acme Support)$/
      })
    ).toBeVisible();
  }
});
