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
import type { Workspace } from "@fonoster/types";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { regionsCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { RegionsApiProvider } from "~/regions/api";
import { createMockRegionsApi } from "~/regions/mock-api";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { StreamsScreen } from ".";
import { SessionApiProvider } from "./api";
import { missingKeys, providersOf } from "./missing-keys";
import { createMockSessionApi } from "./mock-api";
import type { SessionApp } from "./types";

const app = (over: Partial<SessionApp> = {}): SessionApp => ({
  ref: "a1",
  name: "Bot",
  type: "AUTOPILOT",
  url: "",
  protocol: "fonoster",
  signingSecretHint: "",
  speech: {
    voice: "elevenlabs/rachel",
    language: "en-US",
    sttModel: "deepgram/nova-3"
  },
  audio: "pcm16-16000",
  fallback: {},
  listeners: [],
  recording: "",
  assistant: { languageModel: { model: "openai/gpt-4o-mini" } },
  ...over
});

function render(
  route: string,
  ws: Workspace = testWorkspace,
  api = createMockSessionApi()
) {
  return {
    api,
    ...renderScreen(
      <RegionsApiProvider value={createMockRegionsApi()}>
        <WorkspaceProvider value={ws}>
          <SessionApiProvider value={api}>
            <StreamsScreen />
          </SessionApiProvider>
        </WorkspaceProvider>
      </RegionsApiProvider>,
      {
        path: "/w/:workspaceRef/streams/*",
        route,
        auth: fakeAuth({ status: "signedIn", user: { sub: "u1" } as never }),
        capabilities: regionsCapabilities
      }
    )
  };
}

describe("missing provider keys", () => {
  it("names the providers an app's settings use", () => {
    expect(providersOf(app())).toEqual(["elevenlabs", "deepgram", "openai"]);
    expect(providersOf(app({ type: "STREAM" }))).toEqual([
      "elevenlabs",
      "deepgram"
    ]);
    expect(providersOf(app({ speech: { voice: "", language: "" } }))).toEqual([
      "openai"
    ]);
  });

  it("private region: needed minus the keys set in the region", () => {
    expect(missingKeys(app(), { kind: "private", set: ["deepgram"] })).toEqual([
      "elevenlabs",
      "openai"
    ]);
  });

  it("public region: no workspace key and no platform key", () => {
    expect(
      missingKeys(app(), {
        kind: "public",
        usable: ["deepgram", "elevenlabs"],
        workspaceKeys: ["openai"]
      })
    ).toEqual([]);
    expect(
      missingKeys(app(), {
        kind: "public",
        usable: ["deepgram", "elevenlabs"],
        workspaceKeys: []
      })
    ).toEqual(["openai"]);
  });

  it("warns on the streams list of a private workspace and links to the region", async () => {
    render("/w/ws-1/streams", {
      ...testWorkspace,
      region: "acme-dallas"
    } as Workspace);
    const line = await screen.findByText(
      /Missing keys: Support line \(elevenlabs\), Pipecat bot \(elevenlabs\)\./
    );
    expect(line).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add key" })).toHaveAttribute(
      "href",
      "/workspaces?region=rg_7K2QF"
    );
  });

  it("warns in a public workspace's stream drawer and links to Vendor keys", async () => {
    const api = createMockSessionApi();
    const { ref } = await api.saveApp({
      ...app({
        type: "STREAM",
        url: "wss://bot.example.com",
        speech: { voice: "", language: "en-US", sttModel: "openai/whisper" }
      }),
      ref: ""
    });
    render(`/w/ws-1/streams/${ref}`, testWorkspace, api);
    expect(
      await screen.findByText(/This stream needs a key for openai\./)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add key" })).toHaveAttribute(
      "href",
      "/w/ws-1/vendor-keys"
    );
  });

  it("says nothing when every key is there", async () => {
    render("/w/ws-1/streams");
    expect(await screen.findByText("Support line")).toBeInTheDocument();
    expect(screen.queryByText(/Missing keys/)).not.toBeInTheDocument();
  });
});
