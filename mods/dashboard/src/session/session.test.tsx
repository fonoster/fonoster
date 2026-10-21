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
import { CallsScreen, AppsScreen } from ".";
import { SessionApiProvider } from "./api";

import { describeMessage } from "./calls";
import { createMockSessionApi } from "./mock-api";
import { validateApp } from "./apps";
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

const apps = (route: string, api = createMockSessionApi()) => ({
  api,
  ...renderScreen(
    <SessionApiProvider value={api}>
      <AppsScreen />
    </SessionApiProvider>,
    { path: "/w/:workspaceRef/apps/*", route }
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

describe("apps", () => {
  it("lists only apps, with readable protocol names", async () => {
    apps("/w/ws-1/apps", await withAgent());
    expect(
      await screen.findByRole("heading", { name: "Apps" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Support line")).toBeInTheDocument();
    expect(screen.getByText("Pipecat bot")).toBeInTheDocument();
    expect(screen.queryByText("Receptionist agent")).not.toBeInTheDocument();
    expect(screen.getByText("Fonoster")).toBeInTheDocument();
    expect(screen.getByText("Twilio")).toBeInTheDocument();
    expect(screen.queryByText("twilio")).not.toBeInTheDocument();
    expect(screen.queryByText("fonoster")).not.toBeInTheDocument();
  });

  it("warns about deprecated catalog items and names the apps that use them", async () => {
    apps("/w/ws-1/apps");
    expect(
      await screen.findByText(
        "The model deepgram/nova-2 is deprecated and will be retired on 2027-01-31. Use deepgram/nova-3 instead."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Used by: Support line.")).toBeInTheDocument();
  });

  it("creates an app in a dialog, then opens it and shows its secret once", async () => {
    const { user, api } = apps("/w/ws-1/apps");
    await user.click(await screen.findByRole("button", { name: /Create app/ }));
    const dialog = await screen.findByRole("dialog", { name: "New app" });
    // No agent choice here: agents are created under Agents.
    expect(within(dialog).queryByLabelText("Type")).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Create app" })
    );
    expect(within(dialog).getByText("Enter a name")).toBeVisible();
    await user.type(within(dialog).getByLabelText("Name"), "Bot");
    await user.type(within(dialog).getByLabelText("URL"), "http://bot");
    await user.click(
      within(dialog).getByRole("button", { name: "Create app" })
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
      within(dialog).getByRole("button", { name: "Create app" })
    );
    // The new app's page opens behind its signing secret, shown once.
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
    const { user } = apps("/w/ws-1/apps/new");
    const dialog = await screen.findByRole("dialog", { name: "New app" });
    expect(within(dialog).getByLabelText("Audio format")).toBeInTheDocument();
    await user.click(within(dialog).getByLabelText("Protocol"));
    expect(
      (await screen.findAllByRole("option")).map((o) => o.textContent)
    ).toEqual(["Fonoster", "Twilio"]);
    await user.click(screen.getByRole("option", { name: "Twilio" }));
    expect(
      within(dialog).queryByLabelText("Audio format")
    ).not.toBeInTheDocument();
  });

  it("opens an app's page from its row and saves edits across its cards", async () => {
    const { user, api } = apps("/w/ws-1/apps");
    await user.click(await screen.findByText("Pipecat bot"));
    expect(
      await screen.findByRole("heading", { name: "Pipecat bot" })
    ).toBeInTheDocument();
    const name = await screen.findByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Pipecat bot v2");
    await user.click(
      await screen.findByRole("button", { name: /Add listener/ })
    );
    await user.type(screen.getByLabelText("Listener 1 URL"), "https://nope");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByText("Listener URLs must start with ws:// or wss://")
    ).toBeVisible();
    expect(screen.getByText("Fix the highlighted fields before saving."));
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

  it("turns noise cancelling on from Call handling, with the catalog's nc providers", async () => {
    const { user, api } = apps("/w/ws-1/apps");
    await user.click(await screen.findByText("Pipecat bot"));
    await user.click(await screen.findByLabelText("Noise cancelling"));
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "None",
      "ai-coustics"
    ]);
    await user.click(screen.getByRole("option", { name: "ai-coustics" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(async () =>
      expect(await api.getApp("pipecat-bot")).toMatchObject({
        filters: [{ name: "aiCoustics" }]
      })
    );
    // Back to None clears the filters.
    await user.click(await screen.findByLabelText("Noise cancelling"));
    await user.click(screen.getByRole("option", { name: "None" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(async () =>
      expect((await api.getApp("pipecat-bot"))?.filters).toEqual([])
    );
  });

  it("shows speech settings only for Fonoster apps, provider first", async () => {
    const { user } = apps("/w/ws-1/apps/pipecat-bot");
    // pipecat-bot speaks Twilio: its own server does speech.
    expect(
      await screen.findByRole("heading", { name: "Pipecat bot" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Speech" })).toBeNull();
    await user.click(screen.getByLabelText("Protocol"));
    await user.click(await screen.findByRole("option", { name: "Fonoster" }));
    const speech = await screen.findByRole("region", { name: "Speech" });
    expect(within(speech).getByLabelText("Voice provider")).toBeInTheDocument();
    expect(within(speech).getByLabelText("Model provider")).toBeInTheDocument();
  });

  it("shows the numbers that reach an app and its recent calls", async () => {
    apps("/w/ws-1/apps/support-line");
    const reachable = await screen.findByRole("region", {
      name: "Reachable at"
    });
    expect(within(reachable).getByText("+1 809 555 0123")).toBeInTheDocument();
    expect(
      within(reachable).getByText("Trunk · Telnyx EU")
    ).toBeInTheDocument();
    // +1 809 555 0140 points nowhere, so it isn't listed.
    expect(within(reachable).queryByText("+1 809 555 0140")).toBeNull();
    const recent = screen.getByRole("region", { name: "Recent calls" });
    expect(
      within(recent).getByRole("link", { name: /\+1 555 000 1111/ })
    ).toHaveAttribute("href", "/w/ws-1/calls/room-1");
  });

  it("deletes an app from its page behind a confirmation", async () => {
    const { user, api } = apps("/w/ws-1/apps/pipecat-bot");
    await user.click(await screen.findByRole("button", { name: "Delete app" }));
    const confirm = await screen.findByRole("dialog", {
      name: "Delete Pipecat bot?"
    });
    await user.type(within(confirm).getByLabelText(/to confirm/), "DELETE");
    await user.click(within(confirm).getByRole("button", { name: "Delete" }));
    await waitFor(async () =>
      expect(await api.getApp("pipecat-bot")).toBeUndefined()
    );
    expect(
      await screen.findByRole("heading", { name: "Apps" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Pipecat bot")).not.toBeInTheDocument();
  });

  it("rotates the secret behind a confirmation", async () => {
    const { user } = apps("/w/ws-1/apps/support-line");
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

  it("sends an agent opened as an app to the agent page", async () => {
    const api = await withAgent();
    const agent = (await api.listApps()).find((a) => a.type === "AUTOPILOT")!;
    apps(`/w/ws-1/apps/${agent.ref}`, api);
    expect(await screen.findByTestId("location")).toHaveTextContent(
      `/w/ws-1/agents/${agent.ref}`
    );
  });

  it("validates apps", () => {
    const base = { name: "x", url: "wss://x", listeners: [] };
    expect(validateApp(base)).toEqual({});
    expect(
      Object.keys(validateApp({ ...base, name: "", url: "http://x" }))
    ).toEqual(["name", "url"]);
    // Agent mode checks only the call-handling fields it shows.
    expect(
      validateApp(
        { name: "", url: "", listeners: [{ url: "x", tracks: "both" }] },
        "agent"
      )
    ).toEqual({ listeners: "Listener URLs must start with ws:// or wss://" });
  });
});

describe("calls", () => {
  it("shows the record's turns and plays and downloads the recording", async () => {
    render(<CallsScreen />, "/w/:workspaceRef/calls/*", "/w/ws-1/calls/room-1");
    expect(
      await screen.findByRole("heading", {
        name: "+15550001111 → +15550002222"
      })
    ).toBeInTheDocument();
    expect(screen.getByText("I want to check my balance")).toBeInTheDocument();
    expect(await screen.findByLabelText("Call recording")).toHaveAttribute(
      "src",
      "blob:recording-room-1"
    );
    const download = screen.getByRole("link", { name: "Download" });
    expect(download).toHaveAttribute("href", "blob:recording-room-1");
    expect(download).toHaveAttribute("download", "room-1.wav");
  });

  it("flags a call that ran unfiltered, with the filter's reason", async () => {
    render(<CallsScreen />, "/w/:workspaceRef/calls/*", "/w/ws-1/calls/room-2");
    expect(await screen.findByText("room-2")).toBeInTheDocument();
    expect(screen.getByText("Unfiltered")).toBeInTheDocument();
    expect(
      screen.getByText(/aiCoustics: License key format is invalid/)
    ).toBeInTheDocument();
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
    const drawer = await screen.findByRole("dialog", {
      name: "Create webhook"
    });
    await user.type(
      within(drawer).getByLabelText("URL"),
      "https://new.example.com"
    );
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
    const drawer = await screen.findByRole("dialog", {
      name: before.url.replace(/^https?:\/\//, "")
    });
    await user.click(
      within(drawer).getByRole("checkbox", { name: /Call failed/ })
    );
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
    await user.type(screen.getByLabelText(/to confirm/), "DELETE");
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
    const drawer = await screen.findByRole("dialog", {
      name: "Add vendor key"
    });
    // Several providers can take a key (ElevenLabs, ai-coustics), so one is picked.
    await user.click(within(drawer).getByLabelText("Provider"));
    await user.click(await screen.findByRole("option", { name: "ElevenLabs" }));
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

  it("shows the platform keys note instead of Add key when no vendor is configured", async () => {
    const base = createMockSessionApi();
    const catalog = await base.getCatalog();
    const api = {
      ...base,
      getCatalog: async () => ({
        ...catalog,
        providers: catalog.providers.filter((p) => p.keyless)
      }),
      listVendorKeys: async () => []
    };
    renderScreen(
      <SessionApiProvider value={api}>
        <VendorKeysScreen />
      </SessionApiProvider>,
      { path: "/w/:workspaceRef/vendor-keys", route: "/w/ws-1/vendor-keys" }
    );
    expect(await screen.findByText("No vendors configured")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Add platform keys/ })
    ).toHaveAttribute("href", expect.stringContaining("#add-platform-keys"));
    expect(
      screen.queryByRole("button", { name: /Add key/ })
    ).not.toBeInTheDocument();
  });
});
