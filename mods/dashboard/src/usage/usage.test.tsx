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
import { screen, within } from "@testing-library/react";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import UsageScreen from ".";
import { compact, recentMonths, summarize } from "./summary";

const row = (
  meter: string,
  quantity: number,
  extra: Record<string, string> = {}
) => ({
  day: "",
  workspaceRef: "",
  meter,
  unit: "",
  provider: "",
  model: "",
  keySource: "",
  origin: "call",
  quantity,
  ...extra
});

const ROWS = [
  row("call.seconds", 77_040),
  row("call.seconds", 5_760, { origin: "browser_test" }),
  row("stt.seconds", 21_840, {
    provider: "deepgram",
    model: "deepgram/nova-3",
    keySource: "workspace"
  }),
  row("tts.characters", 182_400, {
    provider: "elevenlabs",
    model: "elevenlabs/rachel",
    keySource: "platform"
  }),
  row("llm.tokens.in", 1_200_000, {
    provider: "openai",
    model: "openai/gpt-4o-mini",
    keySource: "platform"
  }),
  row("llm.tokens.out", 340_000, {
    provider: "openai",
    model: "openai/gpt-4o-mini",
    keySource: "platform"
  }),
  row("llm.tokens.cached", 800_000, {
    provider: "openai",
    model: "openai/gpt-4o-mini",
    keySource: "platform"
  }),
  row("nc.seconds", 24_720, { provider: "aicoustics", keySource: "platform" }),
  row("amd.detections", 318),
  row("recording.seconds", 71_400),
  row("storage.bytes", 2_400_000_000, { origin: "api" })
];

function setup(rows: object[]) {
  const usage = { getUsage: vi.fn().mockResolvedValue({ rows }) };
  const auth = fakeAuth({ status: "signedIn", sdk: { usage } as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <UsageScreen />
    </WorkspaceProvider>,
    { auth }
  );
  return { ...view, usage };
}

describe("Usage summary", () => {
  it("splits calls from browser tests and sums the add-ons", () => {
    const s = summarize(ROWS);
    expect(s).toMatchObject({
      empty: false,
      callMinutes: 1284,
      testMinutes: 96,
      noiseCancellingMinutes: 412,
      recordingMinutes: 1190,
      amdDetections: 318,
      storageBytes: 2_400_000_000,
      ownKeys: true
    });
  });

  it("puts one model's token meters on one line with whose key", () => {
    expect(summarize(ROWS).ai).toEqual([
      {
        provider: "deepgram",
        model: "deepgram/nova-3",
        usedFor: "Transcription",
        quantity: "364 min",
        keySource: "workspace"
      },
      {
        provider: "elevenlabs",
        model: "elevenlabs/rachel",
        usedFor: "Speech",
        quantity: "182,400 characters",
        keySource: "platform"
      },
      {
        provider: "openai",
        model: "openai/gpt-4o-mini",
        usedFor: "Language model",
        quantity: "1.2M in · 340K out · 800K cached",
        keySource: "platform"
      },
      {
        provider: "aicoustics",
        model: "aicoustics",
        usedFor: "Noise cancelling",
        quantity: "412 min",
        keySource: "platform"
      }
    ]);
  });

  it("writes short counts and month ranges", () => {
    expect([
      compact(950),
      compact(96_000),
      compact(1_200_000),
      compact(2_000_000)
    ]).toEqual(["950", "96K", "1.2M", "2M"]);
    const [current, previous] = recentMonths(new Date(Date.UTC(2026, 9, 20)));
    expect(current).toEqual({
      value: "2026-10",
      label: "October 2026",
      fromDay: "2026-10-01",
      toDay: "2026-10-31"
    });
    expect(previous).toMatchObject({
      value: "2026-09",
      fromDay: "2026-09-01",
      toDay: "2026-09-30"
    });
  });
});

describe("Usage", () => {
  it("shows the month's usage with no money, whatever billing says", async () => {
    const { usage } = setup(ROWS);
    expect(await screen.findByText("1,284")).toBeInTheDocument();
    expect(screen.getByText("Browser tests")).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "AI usage" });
    expect(
      within(table).getByText("1.2M in · 340K out · 800K cached")
    ).toBeInTheDocument();
    expect(screen.getByText("2.4 GB at most this month")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\$|price|cost|balance/i);
    expect(usage.getUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        groupBy: ["key_source", "origin", "provider", "model"]
      })
    );
  });

  it("labels each AI line with whose key it ran on", async () => {
    setup(ROWS);
    const table = await screen.findByRole("table", { name: "AI usage" });
    const deepgram = (
      await within(table).findByText("deepgram/nova-3")
    ).closest("tr")!;
    const eleven = within(table).getByText("elevenlabs/rachel").closest("tr")!;
    expect(within(deepgram).getByText("Your key")).toBeInTheDocument();
    expect(within(eleven).getByText("Fonoster key")).toBeInTheDocument();
    expect(
      screen.getByText("Usage on your own keys is billed by that vendor.")
    ).toBeInTheDocument();
  });

  it("asks for last month's days when the period changes", async () => {
    const { user, usage } = setup(ROWS);
    await screen.findByText("1,284");
    const [, previous] = recentMonths();
    await user.click(screen.getByRole("combobox", { name: "Period" }));
    await user.click(
      await screen.findByRole("option", { name: previous.label })
    );
    await vi.waitFor(() =>
      expect(usage.getUsage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fromDay: previous.fromDay,
          toDay: previous.toDay
        })
      )
    );
  });

  it("says there is no usage instead of showing zeros", async () => {
    setup([]);
    const [current] = recentMonths();
    expect(
      await screen.findByText(`No usage in ${current.label}.`)
    ).toBeInTheDocument();
    expect(screen.queryByText("Calls")).not.toBeInTheDocument();
  });
});
