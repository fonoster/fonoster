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
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { renderScreen } from "~/test/render";
import { CallsScreen, StreamsScreen } from ".";
import { SessionApiProvider } from "./api";

import { describeMessage } from "./calls";
import { createMockSessionApi } from "./mock-api";
import { validateStream } from "./streams";
import VendorKeysScreen from "./vendor-keys";
import WebhooksScreen, { validateWebhook } from "./webhooks";

function render(element: ReactElement, path: string, route: string) {
  const api = createMockSessionApi();
  return {
    api,
    ...renderScreen(
      <SessionApiProvider value={api}>{element}</SessionApiProvider>,
      { path, route }
    )
  };
}

const streams = (route: string, api = createMockSessionApi()) => ({
  api,
  ...renderScreen(
    <SessionApiProvider value={api}>
      <StreamsScreen />
    </SessionApiProvider>,
    { path: "/w/:workspaceRef/streams/*", route }
  )
});

/** The mock workspace plus an Autopilot agent (agents belong under Autopilot). */
async function withAgent() {
  const api = createMockSessionApi();
  await api.saveApp({
    ref: "",
    name: "Receptionist agent",
    type: "AUTOPILOT",
    url: "",
    protocol: "fonoster",
    speech: { voice: "", language: "" },
    audio: "pcm16-16000",
    fallback: {},
    listeners: [],
    recording: ""
  });
  return api;
}

describe("streams", () => {
  it("lists only streams, with readable protocol names", async () => {
    streams("/w/ws-1/streams", await withAgent());
    expect(
      await screen.findByRole("heading", { name: "Streams" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Support line")).toBeInTheDocument();
    expect(screen.getByText("Pipecat bot")).toBeInTheDocument();
    expect(screen.queryByText("Receptionist agent")).not.toBeInTheDocument();
    expect(screen.getByText("Fonoster")).toBeInTheDocument();
    expect(screen.getByText("Twilio-compatible")).toBeInTheDocument();
    expect(screen.queryByText("twilio")).not.toBeInTheDocument();
    expect(screen.queryByText("fonoster")).not.toBeInTheDocument();
  });

  it("warns about deprecated catalog items and names the streams that use them", async () => {
    streams("/w/ws-1/streams");
    expect(
      await screen.findByText(
        "The model deepgram/nova-2 is deprecated and will be retired on 2027-01-31. Use deepgram/nova-3 instead."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Used by: Support line.")).toBeInTheDocument();
  });

  it("creates a stream in a dialog, then opens it and shows its secret once", async () => {
    const { user, api } = streams("/w/ws-1/streams");
    await user.click(await screen.findByRole("button", { name: /New stream/ }));
    const dialog = await screen.findByRole("dialog", { name: "New stream" });
    // No Autopilot choice here: agents are created under Autopilot.
    expect(within(dialog).queryByLabelText("Type")).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Create stream" })
    );
    expect(within(dialog).getByText("Enter a name")).toBeVisible();
    await user.type(within(dialog).getByLabelText("Name"), "Bot");
    await user.type(within(dialog).getByLabelText("URL"), "http://bot");
    await user.click(
      within(dialog).getByRole("button", { name: "Create stream" })
    );
    expect(
      within(dialog).getByText("Must start with ws:// or wss://")
    ).toBeVisible();
    await user.clear(within(dialog).getByLabelText("URL"));
    await user.type(
      within(dialog).getByLabelText("URL"),
      "wss://bot.example.com"
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create stream" })
    );
    expect(
      await screen.findByRole("heading", { name: "Bot" })
    ).toBeInTheDocument();
    expect(screen.getByText(/shown once/)).toBeInTheDocument();
    const saved = (await api.listApps()).find((a) => a.name === "Bot");
    expect(saved).toMatchObject({
      type: "STREAM",
      url: "wss://bot.example.com",
      protocol: "fonoster"
    });
  });

  it("offers the protocols in plain words; audio format only for Fonoster", async () => {
    const { user } = streams("/w/ws-1/streams/new");
    const dialog = await screen.findByRole("dialog", { name: "New stream" });
    expect(within(dialog).getByLabelText("Audio format")).toBeInTheDocument();
    await user.click(within(dialog).getByLabelText("Protocol"));
    expect(
      (await screen.findAllByRole("option")).map((o) => o.textContent)
    ).toEqual([
      "Fonoster (session protocol)",
      "Twilio-compatible (Media Streams: Pipecat and others)"
    ]);
    await user.click(screen.getByRole("option", { name: /Twilio-compatible/ }));
    expect(
      within(dialog).queryByLabelText("Audio format")
    ).not.toBeInTheDocument();
  });

  it("opens a stream's page from its row and saves edits across tabs", async () => {
    const { user, api } = streams("/w/ws-1/streams");
    await user.click(await screen.findByText("Pipecat bot"));
    expect(
      await screen.findByRole("heading", { name: "Pipecat bot" })
    ).toBeInTheDocument();
    const name = await screen.findByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Pipecat bot v2");
    await user.click(screen.getByRole("link", { name: "Call handling" }));
    await user.click(
      await screen.findByRole("button", { name: /Add listener/ })
    );
    await user.type(screen.getByLabelText("Listener 1 URL"), "https://nope");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByText("Listener URLs must start with ws:// or wss://")
    ).toBeVisible();
    expect(screen.getByText(/Fix the highlighted fields in Call handling/));
    await user.click(screen.getByRole("button", { name: "Remove listener 1" }));
    await user.click(
      screen.getByRole("switch", { name: "Detect answering machines" })
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(async () =>
      expect(await api.getApp("pipecat-bot")).toMatchObject({
        name: "Pipecat bot v2",
        protocol: "twilio",
        amd: true
      })
    );
  });

  it("deletes a stream from Advanced behind a confirmation", async () => {
    const { user, api } = streams("/w/ws-1/streams/pipecat-bot/advanced");
    await user.click(
      await screen.findByRole("button", { name: "Delete stream" })
    );
    const confirm = await screen.findByRole("dialog", {
      name: "Delete Pipecat bot?"
    });
    await user.click(within(confirm).getByRole("button", { name: "Delete" }));
    await waitFor(async () =>
      expect(await api.getApp("pipecat-bot")).toBeUndefined()
    );
    expect(
      await screen.findByRole("heading", { name: "Streams" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Pipecat bot")).not.toBeInTheDocument();
  });

  it("rotates the secret behind a confirmation", async () => {
    const { user } = streams("/w/ws-1/streams/support-line/advanced");
    await user.click(
      await screen.findByRole("button", { name: "Rotate secret" })
    );
    expect(screen.getByText(/no overlap window/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rotate now" }));
    expect(await screen.findByText(/shown once/)).toBeInTheDocument();
  });

  it("sends an agent opened as a stream to the agent page", async () => {
    const api = await withAgent();
    const agent = (await api.listApps()).find((a) => a.type === "AUTOPILOT")!;
    streams(`/w/ws-1/streams/${agent.ref}`, api);
    expect(await screen.findByTestId("location")).toHaveTextContent(
      `/w/ws-1/autopilot/${agent.ref}`
    );
  });

  it("validates streams", () => {
    const base = { name: "x", url: "wss://x", listeners: [] };
    expect(validateStream(base)).toEqual({});
    expect(
      Object.keys(validateStream({ ...base, name: "", url: "http://x" }))
    ).toEqual(["name", "url"]);
    // Agent mode checks only the call-handling fields it shows.
    expect(
      validateStream(
        { name: "", url: "", listeners: [{ url: "x", tracks: "both" }] },
        "agent"
      )
    ).toEqual({ listeners: "Listener URLs must start with ws:// or wss://" });
  });
});

describe("calls", () => {
  it("shows the record's turns and downloads the recording", async () => {
    const { user } = render(
      <CallsScreen />,
      "/w/:workspaceRef/calls/*",
      "/w/ws-1/calls/room-1"
    );
    expect(await screen.findByText("Call room-1")).toBeInTheDocument();
    expect(screen.getByText("I want to check my balance")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /download recording/i })
    );
    expect(
      await screen.findByRole("link", { name: /save recording/i })
    ).toHaveAttribute("href", "blob:recording-room-1");
  });

  it("lists calls", async () => {
    render(<CallsScreen />, "/w/:workspaceRef/calls/*", "/w/ws-1/calls");
    expect(await screen.findAllByText("completed")).toHaveLength(2);
  });

  it("describes messages", () => {
    expect(describeMessage({ type: "session.end", reason: "app_hangup" })).toBe(
      "session.end: app_hangup"
    );
  });
});

describe("webhooks", () => {
  it("creates an endpoint, shows its secret and resends a delivery", async () => {
    const { user, api } = render(
      <WebhooksScreen />,
      "/w/:workspaceRef/webhooks",
      "/w/ws-1/webhooks"
    );
    expect(
      await screen.findByText("https://hooks.example.com/fonoster")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add webhook/i }));
    await user.type(screen.getByLabelText("URL"), "https://new.example.com");
    await user.click(screen.getByRole("button", { name: "Create webhook" }));
    expect(await screen.findByText(/shown once/)).toBeInTheDocument();
    expect((await api.listWebhooks()).map((w) => w.url)).toContain(
      "https://new.example.com"
    );

    await user.click(screen.getByRole("button", { name: "Resend evt_1" }));
    await waitFor(async () =>
      expect((await api.listDeliveries())[0].status).toBe("succeeded")
    );
  });

  it("validates endpoints", () => {
    expect(validateWebhook({ url: "http://x", events: [] })).toEqual({
      url: "Webhook URLs must use https://",
      events: "Choose at least one event"
    });
  });
});

describe("vendor keys", () => {
  it("shows which providers use the workspace's key and removes one", async () => {
    const { user, api } = render(
      <VendorKeysScreen />,
      "/w/:workspaceRef/vendor-keys",
      "/w/ws-1/vendor-keys"
    );
    expect(await screen.findByText(/Your key/)).toBeInTheDocument();
    expect(screen.getByText("Platform key")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Remove key for deepgram" })
    );
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(async () => expect(await api.listVendorKeys()).toEqual([]));
  });
});
