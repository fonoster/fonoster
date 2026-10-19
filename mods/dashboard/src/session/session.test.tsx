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

/** The mock workspace plus an Autopilot agent (agents belong under Agents). */
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
    await user.click(
      await screen.findByRole("button", { name: /Create stream/ })
    );
    const dialog = await screen.findByRole("dialog", { name: "New stream" });
    // No agent choice here: agents are created under Agents.
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
    // The new stream's page opens behind its signing secret, shown once.
    const secret = await screen.findByRole("dialog", {
      name: "Save your signing secret"
    });
    expect(within(secret).getByLabelText("Signing secret")).toBeInTheDocument();
    await user.click(within(secret).getByLabelText("I've saved it"));
    await user.click(within(secret).getByRole("button", { name: "Done" }));
    expect(
      await screen.findByRole("heading", { name: "Bot" })
    ).toBeInTheDocument();
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
    const confirm = await screen.findByRole("dialog", {
      name: "Rotate the signing secret?"
    });
    expect(within(confirm).getByText(/no overlap window/)).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Rotate" }));
    expect(
      await screen.findByRole("dialog", { name: "Save your signing secret" })
    ).toBeInTheDocument();
  });

  it("sends an agent opened as a stream to the agent page", async () => {
    const api = await withAgent();
    const agent = (await api.listApps()).find((a) => a.type === "AUTOPILOT")!;
    streams(`/w/ws-1/streams/${agent.ref}`, api);
    expect(await screen.findByTestId("location")).toHaveTextContent(
      `/w/ws-1/agents/${agent.ref}`
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
    const table = await screen.findByRole("table", { name: "Webhooks" });
    expect(
      await within(table).findByText("https://hooks.example.com/fonoster")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Create webhook/ }));
    const drawer = await screen.findByRole("dialog", { name: "New webhook" });
    await user.type(within(drawer).getByLabelText("URL"), "https://new.example.com");
    await user.click(
      within(drawer).getByRole("button", { name: "Create webhook" })
    );
    const secret = await screen.findByRole("dialog", {
      name: "Save your signing secret"
    });
    expect((await api.listWebhooks()).map((w) => w.url)).toContain(
      "https://new.example.com"
    );
    await user.click(within(secret).getByLabelText("I've saved it"));
    await user.click(within(secret).getByRole("button", { name: "Done" }));

    await user.click(screen.getByRole("button", { name: "Resend evt_1" }));
    await waitFor(async () =>
      expect((await api.listDeliveries())[0].status).toBe("succeeded")
    );
  });

  it("edits an endpoint's events from its row menu, keeping its secret", async () => {
    const { user, api } = render(
      <WebhooksScreen />,
      "/w/:workspaceRef/webhooks",
      "/w/ws-1/webhooks"
    );
    const [before] = await api.listWebhooks();
    await user.click(
      await screen.findByRole("button", { name: `Actions for ${before.url}` })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    const drawer = await screen.findByRole("dialog", { name: before.url });
    await user.click(within(drawer).getByRole("checkbox", { name: /Call failed/ }));
    await user.click(within(drawer).getByRole("button", { name: "Save" }));
    await waitFor(async () =>
      expect((await api.listWebhooks())[0].events).toContain("call.failed")
    );
    expect((await api.listWebhooks())[0].secretHint).toBe(before.secretHint);
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
    const table = await screen.findByRole("table", { name: "Vendor keys" });
    expect(await within(table).findByText("Deepgram")).toBeInTheDocument();
    // Only the workspace's own keys are listed; ElevenLabs uses the platform's.
    expect(within(table).queryByText("ElevenLabs")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Actions for Deepgram" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(async () => expect(await api.listVendorKeys()).toEqual([]));
    expect(await screen.findByText("No vendor keys")).toBeInTheDocument();
  });

  it("adds a key for a provider that uses the platform's key", async () => {
    const { user, api } = render(
      <VendorKeysScreen />,
      "/w/:workspaceRef/vendor-keys",
      "/w/ws-1/vendor-keys"
    );
    await user.click(await screen.findByRole("button", { name: /Add key/ }));
    const drawer = await screen.findByRole("dialog", { name: "Add vendor key" });
    await user.click(within(drawer).getByRole("button", { name: "Add key" }));
    expect(within(drawer).getByText("Enter the API key")).toBeVisible();
    await user.type(within(drawer).getByLabelText("API key"), "sk-test");
    await user.click(within(drawer).getByRole("button", { name: "Add key" }));
    await waitFor(async () =>
      expect((await api.listVendorKeys()).map((k) => k.providerId)).toContain(
        "elevenlabs"
      )
    );
  });
});
