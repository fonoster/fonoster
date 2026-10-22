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
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { FakeApplications } from "./apps";
import { ada, expect, test, tokens } from "./fixtures";
import { applications, type GrpcWebMock } from "./grpc-web";
import {
  fromFixture,
  installRecords,
  toolTurn,
  usageSnapshot,
  type RecordFixture
} from "./records";

test.use({ variant: "community" });

async function signIn(
  page: Page,
  api: GrpcWebMock,
  records: RecordFixture[],
  pageSize?: number,
  apps = new FakeApplications()
) {
  if (!apps.apps.size) {
    apps.add("Front desk", "AUTOPILOT"); // app-1
    apps.add("Billing reminders", "AUTOPILOT"); // app-2
  }
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
        appRef: "app-2",
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

  const table = page.getByRole("table", { name: "Calls" });
  const rows = table.getByRole("row");
  // Two per page, newest first: who handled it, the customer, the number, the status.
  await expect(rows.nth(1)).toContainText("Front desk");
  await expect(rows.nth(1)).toContainText("+1 555 000 5555");
  await expect(rows.nth(1)).toContainText("+1 555 000 2222");
  await expect(rows.nth(1)).toContainText("Completed");
  await expect(rows.nth(2)).toContainText("Billing reminders");
  await expect(page.getByText("2+ calls")).toBeVisible();
  await expect(table.getByText("Busy")).toHaveCount(0);
  // The third comes with Load more.
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(rows.nth(3)).toContainText("Busy");
  await expect(rows.nth(3)).toContainText("+1 555 000 4444");
  await expect(page.getByText("3 calls")).toBeVisible();
  expect(
    api.calls.some((c) => /^GET \/api\/records\?.*pageToken=2/.test(c.method))
  ).toBe(true);

  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Failed" }).click();
  await expect(table.getByText("Busy")).toBeVisible();
  await expect(table.getByText("Front desk")).toHaveCount(0);
  expect(
    api.calls.some((c) => /^GET \/api\/records\?.*status=failed/.test(c.method))
  ).toBe(true);
});

test("[DSH-043] filters calls by direction and by agent, and exports the list as CSV", async ({
  page,
  api
}) => {
  await signIn(page, api, [
    fromFixture("recorded-call", {
      callRef: "call-in",
      appRef: "app-1",
      startedAt: today
    }),
    fromFixture("failed-busy", {
      callRef: "call-out",
      appRef: "app-2",
      startedAt: today - day
    })
  ]);
  await page.getByRole("link", { name: "Calls", exact: true }).click();
  const table = page.getByRole("table", { name: "Calls" });
  await expect(page.getByText("2 calls")).toBeVisible();

  await page.getByRole("combobox", { name: "Direction" }).click();
  await page.getByRole("option", { name: "Outbound" }).click();
  await expect(table.getByText("Billing reminders")).toBeVisible();
  await expect(table.getByText("Front desk")).toHaveCount(0);
  expect(
    api.calls.some((c) =>
      /^GET \/api\/records\?.*direction=outbound/.test(c.method)
    )
  ).toBe(true);

  await page.getByRole("combobox", { name: "Direction" }).click();
  await page.getByRole("option", { name: "All directions" }).click();
  await page.getByRole("combobox", { name: "Agent or app" }).click();
  await page.getByRole("option", { name: "Front desk" }).click();
  await expect(page.getByText("1 call", { exact: true })).toBeVisible();
  await expect(table.getByText("Billing reminders")).toHaveCount(0);
  expect(
    api.calls.some((c) => /^GET \/api\/records\?.*appRef=app-1/.test(c.method))
  ).toBe(true);

  // The listed calls, as CSV.
  const saving = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const file = await saving;
  expect(file.suggestedFilename()).toBe("calls.csv");
  const lines = readFileSync(await file.path(), "utf8")
    .trim()
    .split("\n");
  expect(lines[0]).toMatch(/^callRef,startedAt,direction,handledBy,/);
  expect(lines).toHaveLength(2);
  expect(lines[1]).toMatch(
    /^call-in,.*,inbound,Front desk,app-1,\+15550005555,\+15550002222,/
  );
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
    page.getByRole("heading", { name: "+1 555 000 5555 with Front desk" })
  ).toBeVisible();
  await expect(page.getByText("via +1 555 000 2222")).toBeVisible();
  await expect(page.getByText("The caller hung up")).toBeVisible();

  // Each turn: who spoke, when, and for how long.
  const transcript = page.getByRole("region", { name: "Transcript" });
  const caller = transcript.getByRole("listitem", { name: "caller turn" });
  await expect(caller).toContainText("When are you open?");
  await expect(caller).toContainText("0:01");
  await expect(caller).toContainText("1.8 s");
  const greeting = transcript
    .getByRole("listitem", { name: "agent turn" })
    .first();
  await expect(greeting).toContainText("0:00");
  await expect(greeting).toContainText("1.0 s");

  // The recording plays in the page, seeks on its waveform and downloads as <callRef>.wav.
  const player = page.getByLabel("Call recording");
  await expect(player).toHaveAttribute("src", /^blob:/);
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Seek" })).toBeVisible();
  const download = page.getByRole("link", { name: "Download" });
  await expect(download).toHaveAttribute("download", "call-1.wav");
  expect(api.callsTo("GET /api/records/call-1/recording")).toHaveLength(1);
});

test("[DSH-044] shows how the agent did: response time, tools, usage and interruptions, and exports the vCon", async ({
  page,
  api
}) => {
  await signIn(page, api, [
    fromFixture("recorded-call", {
      callRef: "call-1",
      appRef: "app-1",
      extra: [
        toolTurn(3760, [{ name: "get_hours", ok: true }]),
        usageSnapshot(5500, [
          {
            meter: "stt.seconds",
            quantity: 4,
            provider: "deepgram",
            keySource: "platform"
          },
          {
            meter: "llm.tokens.in",
            quantity: 1200,
            provider: "openai",
            model: "gpt-4o-mini",
            keySource: "platform"
          }
        ])
      ]
    }),
    fromFixture("handoff", { callRef: "call-cut", appRef: "app-1" })
  ]);
  await page.goto("/w/ws-1/calls/call-1");

  // The answer to the caller: how long they waited for its first audio.
  const answer = page
    .getByRole("region", { name: "Transcript" })
    .getByRole("listitem", { name: "agent turn" })
    .nth(1);
  await expect(answer).toContainText("first audio 100 ms");
  await expect(
    page.getByRole("region", { name: "Response time" })
  ).toContainText("p50 100 ms");
  const tool = page.getByRole("listitem", { name: "tool call" });
  await expect(tool).toContainText("get_hours");
  await expect(tool).toContainText("ok");
  const usage = page.getByRole("region", { name: "Usage" });
  await expect(usage).toContainText("Speech-to-text · deepgram");
  await expect(usage).toContainText("0:04");
  await expect(usage).toContainText("LLM input · gpt-4o-mini");
  await expect(usage).toContainText("1.2K tokens");
  await expect(usage).not.toContainText("$");
  const facts = page.getByRole("region", { name: "In this call" });
  await expect(facts).toContainText("2 agent · 1 caller");
  await expect(facts).toContainText("get_hours");

  // The raw decisions are one tab away.
  await page.getByRole("tab", { name: "Events" }).click();
  await expect(
    page.getByRole("list", { name: "Events" }).getByText(/turn\.ended/)
  ).toBeVisible();

  // The record itself, as the vCon the API returned.
  const saving = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const file = await saving;
  expect(file.suggestedFilename()).toBe("call-1.vcon.json");
  const vcon = JSON.parse(readFileSync(await file.path(), "utf8"));
  expect(vcon.dialog.length).toBeGreaterThan(0);

  // An agent cut off by the caller says when.
  await page.goto("/w/ws-1/calls/call-cut");
  await expect(
    page
      .getByRole("listitem", { name: "agent turn" })
      .filter({ hasText: "interrupted" })
  ).toContainText("interrupted at 0:03");
  await expect(
    page.getByRole("region", { name: "In this call" })
  ).toContainText(/Interruptions\s*1/);
});

test("[DSH-045] says who answered a call, by answering machine detection", async ({
  page,
  api
}) => {
  const amd = {
    atMs: 900,
    source: "event",
    message: {
      type: "amd.result",
      status: "voicemail",
      confidence: 0.94,
      detector: "amd-onnx",
      audioMs: 820
    }
  };
  await signIn(page, api, [
    fromFixture("recorded-call", {
      callRef: "call-vm",
      appRef: "app-1",
      startedAt: today,
      extra: [amd]
    }),
    fromFixture("recorded-call", {
      callRef: "call-plain",
      appRef: "app-2",
      startedAt: today - day
    })
  ]);
  await page.getByRole("link", { name: "Calls", exact: true }).click();
  const rows = page.getByRole("table", { name: "Calls" }).getByRole("row");
  await expect(rows.first()).toContainText("Answered by");
  await expect(rows.nth(1)).toContainText("Voicemail");
  // No AMD, no verdict: a dash, never a guess.
  await expect(rows.nth(2)).toContainText("Billing reminders");
  await expect(rows.nth(2)).not.toContainText("Human");
  await expect(rows.nth(2)).not.toContainText("Voicemail");

  await rows.nth(1).click();
  await expect(page.getByText("Answered by voicemail")).toBeVisible();
  const answered = page
    .getByRole("region", { name: "Transcript" })
    .getByRole("listitem")
    .first();
  await expect(answered).toContainText("Call answered");
  await expect(answered).toContainText("AMD");
  await expect(answered).toContainText("voicemail 0.94");
  await expect(answered).toContainText("820 ms");
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
    page.getByRole("heading", { name: "+1 555 000 4444" })
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

test("[DSH-054] filters calls by an app, not only by an agent", async ({
  page,
  api
}) => {
  const apps = new FakeApplications();
  apps.add("Front desk", "AUTOPILOT"); // app-1
  apps.add("Order status", "STREAM"); // app-2, a voice app the workspace runs itself
  await signIn(
    page,
    api,
    [
      fromFixture("recorded-call", {
        callRef: "call-agent",
        appRef: "app-1",
        startedAt: today
      }),
      fromFixture("recorded-call", {
        callRef: "call-app",
        appRef: "app-2",
        startedAt: today - day
      })
    ],
    undefined,
    apps
  );
  await page.getByRole("link", { name: "Calls", exact: true }).click();
  const table = page.getByRole("table", { name: "Calls" });
  await expect(page.getByText("2 calls")).toBeVisible();

  await page.getByRole("combobox", { name: "Agent or app" }).click();
  await page.getByRole("option", { name: "Order status" }).click();
  await expect(page.getByText("1 call", { exact: true })).toBeVisible();
  await expect(table.getByText("Order status")).toBeVisible();
  await expect(table.getByText("Front desk")).toHaveCount(0);
  expect(
    api.calls.some((c) => /^GET \/api\/records\?.*appRef=app-2/.test(c.method))
  ).toBe(true);
});

test("[DSH-055] flags a call whose noise filter failed as Unfiltered, with the reason, and only that call", async ({
  page,
  api
}) => {
  // The agent runs with noise cancelling; one call's filter failed, the other's worked.
  const apps = new FakeApplications();
  apps.add("Front desk", "AUTOPILOT", (app) => {
    const filter = new applications.AudioFilter();
    filter.setName("aiCoustics");
    app.setFiltersList([filter]);
  });
  await signIn(
    page,
    api,
    [
      fromFixture("recorded-call", {
        callRef: "call-unfiltered",
        appRef: "app-1",
        extra: [
          {
            atMs: 50,
            source: "event",
            message: {
              type: "filter.failed",
              name: "aiCoustics",
              reason: "license rejected"
            }
          }
        ]
      }),
      fromFixture("recorded-call", {
        callRef: "call-filtered",
        appRef: "app-1"
      })
    ],
    undefined,
    apps
  );

  await page.goto("/w/ws-1/calls/call-unfiltered");
  await expect(
    page.getByRole("heading", { name: "+1 555 000 5555 with Front desk" })
  ).toBeVisible();
  await expect(page.getByText("Unfiltered", { exact: true })).toBeVisible();
  await expect(page.getByText("aiCoustics: license rejected")).toBeVisible();
  // The reason has its own badge, not a bare problem line.
  await expect(page.getByText("Problem: filter.failed")).toHaveCount(0);

  await page.goto("/w/ws-1/calls/call-filtered");
  await expect(
    page.getByRole("heading", { name: "+1 555 000 5555 with Front desk" })
  ).toBeVisible();
  await expect(page.getByText("The caller hung up")).toBeVisible();
  await expect(page.getByText("Unfiltered", { exact: true })).toHaveCount(0);
});
