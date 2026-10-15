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
import { screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { renderScreen } from "~/test/render";
import { AppsScreen, CallsScreen } from ".";
import { SessionApiProvider } from "./api";
import { validateApp } from "./apps";
import { describeMessage } from "./calls";
import { createMockSessionApi } from "./mock-api";
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

const apps = (route: string) =>
  render(<AppsScreen />, "/w/:workspaceRef/apps/*", route);

describe("apps", () => {
  it("lists apps", async () => {
    apps("/w/ws-1/apps");
    expect(await screen.findByText("Support line")).toBeInTheDocument();
    expect(screen.getByText("twilio")).toBeInTheDocument();
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

  it("creates an app and shows its secret once", async () => {
    const { user, api } = apps("/w/ws-1/apps/new");
    await user.type(await screen.findByLabelText("Name"), "Bot");
    await user.type(screen.getByLabelText("URL"), "http://bot");
    await user.click(screen.getByRole("button", { name: "Create app" }));
    expect(screen.getByText("Must start with ws:// or wss://")).toBeVisible();
    await user.clear(screen.getByLabelText("URL"));
    await user.type(screen.getByLabelText("URL"), "wss://bot.example.com");
    await user.click(screen.getByRole("button", { name: "Create app" }));
    expect(await screen.findByText(/shown once/)).toBeInTheDocument();
    const saved = (await api.listApps()).find((a) => a.name === "Bot");
    expect(saved).toMatchObject({
      url: "wss://bot.example.com",
      flavor: "native"
    });
  });

  it("picks an Autopilot language model from the catalog into the assistant", async () => {
    const { user } = apps("/w/ws-1/apps/new");
    await user.click(await screen.findByLabelText("Type"));
    await user.click(await screen.findByRole("option", { name: /Autopilot/ }));
    await user.click(screen.getByLabelText("Language model"));
    expect(
      (await screen.findAllByRole("option")).map((o) => o.textContent)
    ).toEqual(["Platform default", "openai/gpt-4o-mini", "acme/no-tools"]);
    await user.click(screen.getByRole("option", { name: "acme/no-tools" }));
    expect(
      (screen.getByLabelText("Assistant (JSON)") as HTMLTextAreaElement).value
    ).toContain('"model": "acme/no-tools"');
  });

  it("rotates the secret behind a confirmation", async () => {
    const { user } = apps("/w/ws-1/apps/support-line");
    await user.click(
      await screen.findByRole("button", { name: "Rotate secret" })
    );
    expect(screen.getByText(/no overlap window/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rotate now" }));
    expect(await screen.findByText(/shown once/)).toBeInTheDocument();
  });

  it("validates apps", () => {
    const base = {
      name: "x",
      type: "EXTERNAL" as const,
      url: "wss://x",
      listeners: [],
      assistantText: "{}"
    };
    expect(validateApp(base)).toEqual({});
    expect(
      Object.keys(validateApp({ ...base, name: "", url: "http://x" }))
    ).toEqual(["name", "url"]);
    // Autopilot: the URL may be empty (hosted Autopilot); the assistant must be JSON.
    expect(
      validateApp({ ...base, type: "AUTOPILOT", url: "", assistantText: "{" })
    ).toEqual({ assistant: "Not valid JSON" });
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
