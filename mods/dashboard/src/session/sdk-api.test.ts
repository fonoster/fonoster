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
import type { Application, CatalogItem } from "@fonoster/types";
import { describe, expect, it } from "vitest";
import { fromVcon, toCatalog, toRequest, toSessionApp } from "./sdk-api";

describe("SDK adapter", () => {
  const app = {
    ref: "a1",
    name: "Bot",
    type: "EXTERNAL",
    url: "wss://bot.example.com",
    flavor: "native",
    signingSecretHint: "…abcd",
    speech: { voice: "elevenlabs/rachel", language: "es-419", patience: "low" },
    audio: { codec: "pcmu", rate: 8000 },
    fallbackAppRef: "",
    fallbackMessage: "Sorry",
    listeners: [{ url: "wss://l", tracks: "inbound" }],
    recording: "consent",
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as Application;

  it("maps an API app to the page's shape and back", () => {
    const mapped = toSessionApp(app);
    expect(mapped).toMatchObject({
      ref: "a1",
      type: "EXTERNAL",
      audio: "pcmu-8000",
      fallback: { message: "Sorry" },
      recording: "consent",
      speech: {
        voice: "elevenlabs/rachel",
        language: "es-419",
        patience: "low"
      }
    });
    const request = toRequest(mapped);
    expect(request).toMatchObject({
      name: "Bot",
      url: "wss://bot.example.com",
      flavor: "native",
      audio: { codec: "pcmu", rate: 8000 },
      fallbackMessage: "Sorry",
      recording: "consent",
      listeners: [{ url: "wss://l", tracks: "inbound" }]
    });
    expect(request.fallbackAppRef).toBeUndefined();
  });

  it("maps the AMD setting both ways, keeping the window (AO-B1)", () => {
    const on = toSessionApp({
      ...app,
      amd: { enabled: true, windowMs: 3000 }
    } as Application);
    expect(on).toMatchObject({ amd: true, amdWindowMs: 3000 });
    expect(toRequest(on).amd).toEqual({ enabled: true, windowMs: 3000 });
    const off = toSessionApp({
      ...app,
      amd: { enabled: false, windowMs: 0 }
    } as Application);
    expect(off.amd).toBe(false);
    expect(toRequest(off).amd).toBeUndefined();
    expect(toRequest({ ...off, amd: true }).amd).toEqual({ enabled: true });
  });

  it("sends the assistant and no URL for an Autopilot app on the hosted Autopilot", () => {
    const request = toRequest({
      ...toSessionApp(app),
      type: "AUTOPILOT",
      url: "",
      flavor: "twilio",
      assistant: { languageModel: { model: "openai/gpt-4o-mini" } }
    });
    expect(request.url).toBeUndefined();
    expect(request.flavor).toBe("native");
    expect(request.intelligence?.config).toEqual({
      languageModel: { model: "openai/gpt-4o-mini" }
    });
  });

  it("builds the pickers from the catalog", () => {
    const items = [
      {
        id: "deepgram",
        kind: "provider",
        state: "active",
        providerId: "deepgram"
      },
      {
        id: "deepgram/nova-3",
        kind: "model",
        type: "stt",
        state: "active",
        providerId: "deepgram",
        languages: ["es-419", "en-US"]
      },
      {
        id: "deepgram/aura-2-thalia-en",
        kind: "voice",
        state: "deprecated",
        replacement: "deepgram/aura-3",
        providerId: "deepgram",
        languages: ["en-US"]
      }
    ] as CatalogItem[];
    const catalog = toCatalog(items);
    expect(catalog.providers.map((p) => p.id)).toEqual(["deepgram"]);
    expect(catalog.sttModels.map((p) => p.id)).toEqual(["deepgram/nova-3"]);
    expect(catalog.voices[0]).toMatchObject({
      state: "deprecated",
      replacement: "deepgram/aura-3"
    });
    expect(catalog.languages.map((l) => l.id)).toEqual(["en-US", "es-419"]);
    expect(catalog.voices[0].languages).toEqual(["en-US"]);
    expect(catalog.llmModels).toEqual([]);
  });

  it("reads turns, decisions and warnings from a vCon", () => {
    const summary = {
      callRef: "c1",
      appRef: "a1",
      from: "+1",
      to: "+2",
      direction: "inbound",
      startedAt: "2026-10-15T10:00:00.000Z",
      durationMs: 5000,
      status: "completed",
      version: 1
    };
    const record = fromVcon(summary, {
      redacted: true,
      vcon: {
        dialog: [
          {
            type: "recording",
            url: "parts/recording.wav",
            content_hash: "sha512-x"
          },
          {
            type: "text",
            originator: 2,
            start: "2026-10-15T10:00:01.000Z",
            body: "Hi there"
          },
          {
            type: "text",
            originator: 0,
            start: "2026-10-15T10:00:03.000Z",
            body: "Hello"
          }
        ],
        analysis: [
          {
            type: "turn_decisions",
            body: [
              {
                at: "2026-10-15T10:00:03.000Z",
                type: "turn.ended",
                text: "Hello"
              }
            ]
          }
        ],
        fonoster: {
          startedAt: "2026-10-15T10:00:00.000Z",
          endReason: "caller_hangup",
          missing: ["recording"],
          failures: []
        }
      }
    });
    expect(record.turns).toEqual([
      expect.objectContaining({
        side: "agent",
        text: "Hi there",
        startMs: 1000
      }),
      expect.objectContaining({
        side: "caller",
        text: "Hello",
        startMs: 3000,
        outcome: "ok"
      })
    ]);
    expect(record.messages[0]).toMatchObject({
      at: 3000,
      message: { type: "turn.ended", text: "Hello" }
    });
    expect(record.warnings).toEqual(["Missing: recording"]);
    expect(record.endReason).toBe("caller_hangup");
    expect(record.recording).toEqual({ sha256: "sha512-x" });
  });
});
