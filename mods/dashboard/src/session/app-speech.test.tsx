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
/** An app page's Speech card: the agent's Voice and Transcriber pickers, with None (#1445). */
import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloudCatalogItems } from "~/agents/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { AppsScreen } from ".";
import { SessionApiProvider } from "./api";
import { createMockSessionApi } from "./mock-api";
import type { SessionApp } from "./types";

const FERNANDA = {
  voice: "deepgram/flux-fernanda-es",
  ttsModel: "deepgram/flux",
  language: "es-MX"
};

/** Support line (a Fonoster app) with this speech, on Fonoster Cloud's catalog. */
async function openApp(speech: Partial<SessionApp["speech"]>) {
  const api = createMockSessionApi();
  const app = (await api.getApp("support-line"))!;
  await api.saveApp({ ...app, speech: { voice: "", language: "", ...speech } });
  const auth = fakeAuth({
    status: "signedIn",
    sdk: {
      ...fakeAuth().sdk,
      providers: {
        listCatalog: vi.fn().mockResolvedValue({ items: cloudCatalogItems })
      }
    } as never
  });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <SessionApiProvider value={api}>
        <AppsScreen />
      </SessionApiProvider>
    </WorkspaceProvider>,
    {
      path: "/w/:workspaceRef/apps/*",
      route: "/w/ws-1/apps/support-line",
      auth
    }
  );
  const card = await screen.findByRole("region", { name: "Speech" });
  const row = (name: "Voice" | "Transcriber") =>
    within(card).getByRole("button", { name: new RegExp(`^${name}`) });
  const saved = async () => (await api.getApp("support-line"))!.speech;
  const save = () =>
    view.user.click(screen.getByRole("button", { name: "Save" }));
  const choose = async (label: string, option: string) => {
    await view.user.click(within(card).getByLabelText(label));
    await view.user.click(await screen.findByRole("option", { name: option }));
  };
  return { ...view, api, card, row, saved, save, choose };
}

const optionNames = () =>
  screen.getAllByRole("option").map((o) => o.textContent);

describe("app speech", () => {
  it("offers every vendor with a TTS model, whatever the app's language", async () => {
    const { user, row, card } = await openApp({
      voice: "deepgram/flux-aina-es",
      ttsModel: "deepgram/flux",
      language: "es-ES"
    });
    await user.click(row("Voice"));
    await user.click(within(card).getByLabelText("Vendor"));
    expect(optionNames()).toEqual(["None", "Deepgram", "ElevenLabs"]);
  });

  it("lists the model's voices with chips, a filter and a count", async () => {
    const { user, row, card } = await openApp(FERNANDA);
    await user.click(row("Voice"));
    expect(
      within(card).getByRole("radio", { name: "Fernanda" })
    ).toHaveAccessibleDescription("es-mx female mexican");
    expect(within(card).getByText("266 voices")).toBeInTheDocument();
    await user.type(
      within(card).getByLabelText("Filter voices by name"),
      "Fer"
    );
    expect(within(card).getByText("1 of 266 voices")).toBeInTheDocument();
    expect(within(card).queryByRole("radio", { name: "Ernesto" })).toBeNull();
  });

  it("saves a typed voice ID with its vendor", async () => {
    const { user, row, card, choose, save, saved } = await openApp(FERNANDA);
    await user.click(row("Voice"));
    await choose("Vendor", "ElevenLabs");
    await user.type(within(card).getByLabelText("Or enter a voice ID"), "abc");
    await save();
    await waitFor(async () =>
      expect(await saved()).toMatchObject({
        voice: "elevenlabs/abc",
        ttsModel: "elevenlabs/eleven_v4_turbo"
      })
    );
  });

  it("reads a saved voice the catalog doesn't list back as the typed ID", async () => {
    const { user, row, card, save, saved } = await openApp({
      voice: "elevenlabs/abc",
      language: "en-US"
    });
    await user.click(row("Voice"));
    expect(within(card).getByLabelText("Vendor")).toHaveTextContent(
      "ElevenLabs"
    );
    expect(within(card).getByLabelText("Or enter a voice ID")).toHaveValue(
      "abc"
    );
    await user.type(screen.getByLabelText("Name"), " 2");
    await save();
    await waitFor(async () =>
      expect((await saved()).voice).toBe("elevenlabs/abc")
    );
  });

  it("saves the model and a speed other than 1.0×; 1.0× is unset", async () => {
    const { user, row, card, save, saved } = await openApp(FERNANDA);
    await user.click(row("Voice"));
    const speed = within(card).getByRole("slider");
    speed.focus();
    await user.keyboard("{ArrowRight}");
    await save();
    await waitFor(async () =>
      expect(await saved()).toMatchObject({
        ttsModel: "deepgram/flux",
        speed: 1.1
      })
    );
    speed.focus();
    await user.keyboard("{ArrowLeft}");
    await save();
    await waitFor(async () => expect((await saved()).speed).toBeUndefined());
  });

  it("clears the voice, model and speed with Vendor None", async () => {
    const { user, row, card, choose, save, saved } = await openApp({
      ...FERNANDA,
      speed: 1.1
    });
    await user.click(row("Voice"));
    await choose("Vendor", "None");
    expect(within(card).queryByLabelText("Model")).toBeNull();
    expect(within(card).queryByLabelText("Or enter a voice ID")).toBeNull();
    expect(within(card).queryByRole("slider")).toBeNull();
    await save();
    await waitFor(async () =>
      expect(await saved()).toMatchObject({
        voice: "",
        ttsModel: undefined,
        speed: undefined
      })
    );
    expect(row("Voice")).toHaveTextContent(/^VoiceNone$/);
  });

  it("asks for a voice when a vendor has none picked or typed", async () => {
    const { user, row, card, choose, save, saved } = await openApp(FERNANDA);
    await user.click(row("Voice"));
    await choose("Vendor", "ElevenLabs");
    const id = within(card).getByLabelText("Or enter a voice ID");
    await user.type(id, "abc");
    await user.clear(id);
    await save();
    expect(await within(card).findByText("Pick a voice")).toBeInTheDocument();
    expect((await saved()).voice).toBe(FERNANDA.voice);
  });

  it("offers the transcriber model's languages and the patience", async () => {
    const { user, row, card } = await openApp({
      ...FERNANDA,
      sttModel: "deepgram/nova-3"
    });
    await user.click(row("Transcriber"));
    expect(within(card).getByLabelText("Model")).toHaveTextContent("Nova 3");
    expect(
      within(card).getByText(
        "How long Fonoster waits before deciding the caller finished."
      )
    ).toBeInTheDocument();
    await user.click(within(card).getByLabelText("Language"));
    expect(optionNames()).toEqual([
      "English",
      "English (United States)",
      "English (United Kingdom)",
      "Spanish",
      "Spanish (Mexico)",
      "Spanish (Latin America)",
      "Multilingual"
    ]);
  });

  it("sums up both rows closed, and None when unset", async () => {
    const { row } = await openApp({
      ...FERNANDA,
      sttModel: "deepgram/nova-3",
      patience: "low"
    });
    expect(row("Voice")).toHaveTextContent("Deepgram · Flux · Fernanda");
    expect(row("Voice")).toHaveTextContent("1.0×");
    expect(row("Transcriber")).toHaveTextContent("Deepgram · Nova 3");
    expect(row("Transcriber")).toHaveTextContent("es-mx · low patience");
  });

  it("keeps a language saved without a transcriber model", async () => {
    const { user, row, save, saved } = await openApp({
      ...FERNANDA,
      sttModel: undefined
    });
    expect(row("Transcriber")).toHaveTextContent(/^TranscriberNonees-mx$/);
    await user.type(screen.getByLabelText("Name"), " 2");
    await save();
    await waitFor(async () =>
      expect(await saved()).toMatchObject({
        language: "es-MX",
        sttModel: undefined
      })
    );
  });
});
