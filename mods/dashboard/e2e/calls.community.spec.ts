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
 * Calls and call records (spec change dashboard-call-records), against the records API
 * serving vCons built by the call-record module from its own fixture calls.
 */
import type { Page } from "@playwright/test";
import { FakeApplications } from "./apps";
import { ada, expect, test, tokens } from "./fixtures";
import type { GrpcWebMock } from "./grpc-web";
import { fromFixture, installRecords, type RecordFixture } from "./records";

test.use({ variant: "community" });

async function signIn(
  page: Page,
  api: GrpcWebMock,
  records: RecordFixture[],
  pageSize?: number
) {
  const apps = new FakeApplications();
  apps.add("Front desk", "AUTOPILOT"); // app-1
  apps.install(api);
  installRecords(api, records, { pageSize });
  api.on("Identity/ExchangeCredentials", () => tokens(ada));
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await expect(page).toHaveURL(/\/w\/ws-1$/);
}

const day = 24 * 3600 * 1000;
const today = Date.now() - 3600 * 1000;

test("[DSH-030] lists calls newest first, filters by status, and loads more", async ({
  page,
  api
}) => {
  await signIn(
    page,
    api,
    [
      fromFixture("recorded-call", {
        callRef: "call-yesterday",
        appRef: "app-1",
        startedAt: today - day
      }),
      fromFixture("recorded-call", {
        callRef: "call-today",
        appRef: "app-1",
        startedAt: today
      }),
      fromFixture("failed-busy", {
        callRef: "call-busy",
        startedAt: today - 2 * day
      })
    ],
    2
  );
  await page.getByRole("link", { name: "Calls", exact: true }).click();

  const rows = page.getByRole("table", { name: "Calls" }).getByRole("row");
  // Two per page, newest first; the third comes with Load more.
  await expect(rows.nth(1)).toContainText("call-today");
  await expect(rows.nth(2)).toContainText("call-yesterday");
  await expect(page.getByText("call-busy")).toHaveCount(0);
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(rows.nth(3)).toContainText("call-busy");
  expect(
    api.calls.some((c) => /^GET \/api\/records\?.*pageToken=2/.test(c.method))
  ).toBe(true);

  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Failed" }).click();
  await expect(page.getByText("call-busy")).toBeVisible();
  await expect(page.getByText("call-today")).toHaveCount(0);
  expect(
    api.calls.some((c) => /^GET \/api\/records\?.*status=failed/.test(c.method))
  ).toBe(true);
});

test("[DSH-031] shows a completed call as the conversation, and plays and downloads its recording", async ({
  page,
  api
}) => {
  await signIn(page, api, [
    fromFixture("recorded-call", {
      callRef: "call-1",
      appRef: "app-1",
      recordedMs: 4600
    })
  ]);
  await page.goto("/w/ws-1/calls/call-1");

  await expect(
    page.getByRole("heading", { name: "+15550005555 → +15550002222" })
  ).toBeVisible();
  await expect(page.getByText("Answered by")).toBeVisible();
  await expect(page.getByText("Front desk")).toBeVisible();
  await expect(page.getByText("The caller hung up")).toBeVisible();

  // Each turn: who spoke, when, and for how long.
  const transcript = page.getByRole("region", { name: "Transcript" });
  const caller = transcript.getByRole("listitem", { name: "caller turn" });
  await expect(caller).toContainText("When are you open?");
  await expect(caller).toContainText("1.8 s · 1.8 s");
  await expect(
    transcript.getByRole("listitem", { name: "agent turn" }).first()
  ).toContainText("0.4 s · 1.0 s");

  // The recording plays in the page and downloads as <callRef>.wav.
  const player = page.getByLabel("Call recording");
  await expect(player).toHaveAttribute("src", /^blob:/);
  const download = page.getByRole("link", { name: "Download" });
  await expect(download).toHaveAttribute("download", "call-1.wav");
  expect(api.callsTo("GET /api/records/call-1/recording")).toHaveLength(1);
});

test("[DSH-032] says why a failed call failed, with its SIP status and no transcript", async ({
  page,
  api
}) => {
  await signIn(page, api, [
    fromFixture("failed-busy", { callRef: "call-busy" })
  ]);
  await page.goto("/w/ws-1/calls/call-busy");

  await expect(
    page.getByRole("heading", { name: "+15550002222 → +15550004444" })
  ).toBeVisible();
  await expect(page.getByText("The line was busy (SIP 486)")).toBeVisible();
  await expect(page.getByText("This call wasn't recorded.")).toBeVisible();
  await expect(page.getByText("Nothing was said.")).toBeVisible();
  await expect(page.getByLabel("Call recording")).toHaveCount(0);
});

test("[DSH-033] says a record was erased or doesn't exist, without a raw error", async ({
  page,
  api
}) => {
  const erased = fromFixture("handoff", { callRef: "call-erased" });
  erased.summary = { ...erased.summary, status: "erased" };
  erased.detail = { status: 410, json: { error: "erased" } };
  await signIn(page, api, [erased]);

  const started = Date.now();
  await page.goto("/w/ws-1/calls/call-erased");
  await expect(
    page.getByRole("heading", { name: "Call record erased" })
  ).toBeVisible();
  // At once: not after retrying a refused request.
  expect(Date.now() - started).toBeLessThan(4000);
  await expect(page.getByText(/records API/)).toHaveCount(0);

  await page.goto("/w/ws-1/calls/call-missing");
  await expect(
    page.getByRole("heading", { name: "Call record not found" })
  ).toBeVisible();
  await expect(
    page.getByText("This workspace has no record of call call-missing.")
  ).toBeVisible();
});
