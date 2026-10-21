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
import {
  DetachedPeer,
  FakesHarness,
  Peer,
  Scenario
} from "@fonoster/conformance";
import { z } from "zod";
import { AppConfig, MemoryCallRecordSink } from "../src";
import { AudioFilterFactory } from "../src/filters";

// What both voice-session runners (fake node, Go node) need from a scenario's setup: the apps
// (app-1 under test, app-2 the harness's second app), filters, record and webhook readers, and
// outbound calls placed the way the control plane places them.

export const SCENARIO_SECRET = "conformance-secret";

/** `conformance-mute` (SCENARIOS.md): silences every caller frame. */
AudioFilterFactory.registerFilter("conformance-mute", {
  description: "silences every frame (conformance only)",
  optionsSchema: z.object({}),
  publicOptionsSchema: z.object({}),
  create: () => ({
    name: "conformance-mute",
    delayMs: 0,
    process: (frame: Int16Array) => new Int16Array(frame.length)
  })
});

/** `conformance-boom` (SCENARIOS.md): passes audio through, then throws on the third frame. */
AudioFilterFactory.registerFilter("conformance-boom", {
  description: "throws on the third frame (conformance only)",
  optionsSchema: z.object({}),
  publicOptionsSchema: z.object({}),
  create: () => {
    let frames = 0;
    return {
      name: "conformance-boom",
      delayMs: 0,
      process: (frame: Int16Array) => {
        if (++frames === 3) throw new Error("kaput");
        return frame;
      }
    };
  }
});

export function appsFor(
  scenario: Scenario,
  harness: FakesHarness,
  protocol?: "fonoster" | "twilio"
): AppConfig[] {
  const a = scenario.setup?.app ?? {};
  const listener = scenario.setup?.listener;
  return [
    {
      ref: "app-1",
      url: harness.app.url,
      protocol:
        protocol ??
        a.protocol ??
        (scenario.contract === "twilio-media-streams-flavor"
          ? "twilio"
          : "fonoster"),
      signingSecret: a.signingSecret ?? SCENARIO_SECRET,
      speech: {
        voice: "fake/default",
        language: "en-US",
        ...((a.speech as AppConfig["speech"]) ?? {})
      },
      ...(a.workspaceRef ? { workspaceRef: a.workspaceRef } : {}),
      ...(a.fallback ? { fallback: a.fallback } : {}),
      ...(a.filters ? { filters: a.filters } : {}),
      ...(listener
        ? {
            listeners: [
              {
                url: harness.otherApp.url,
                tracks: listener.tracks ?? "inbound"
              }
            ]
          }
        : {})
    },
    {
      // Reached only by appRef, fallback or handoff (numbers no call uses).
      ref: "app-2",
      url: harness.otherApp.url,
      protocol: "fonoster",
      signingSecret: SCENARIO_SECRET,
      numbers: ["+0"],
      ...(a.workspaceRef ? { workspaceRef: a.workspaceRef } : {}),
      speech: { voice: "fake/default", language: "en-US" }
    }
  ];
}

/** record.events.<type> and record.messages.<type> over a memory sink. */
export function recordReaders(record: MemoryCallRecordSink) {
  const entries = () => [...record.records.values()].flat();
  return {
    recordEvents: (type: string) =>
      entries()
        .filter((e) => e.source === "event" && e.message.type === type)
        .map((e) => e.message as Record<string, unknown>),
    recordMessages: (type: string) =>
      entries()
        .filter((e) => e.message.type === type)
        .map((e) => ({ ...e.message, source: e.source, at: e.at }))
  };
}

/**
 * An outbound call as the node opens it once the callee answered (Outbound sessions open at
 * answer): a control stream whose Start carries CreateCall's metadata (`app_ref`). A busy,
 * unanswered or failed callee opens no stream, so AppBridge never hears of it (the control
 * plane records those from the node's call.ended).
 */
export async function placeOutbound(
  harness: FakesHarness,
  scenario: Scenario
): Promise<Peer> {
  const call = scenario.setup?.call ?? {};
  const outcome = scenario.setup?.media?.dialOutcome ?? "answered";
  if (outcome !== "answered") return new DetachedPeer();
  const mark = harness.connectionMark();
  await harness.roomrNode.placeCall({
    appRef: scenario.setup?.media?.appRef ?? "app-1",
    ...(call.callRef ? { callRef: call.callRef } : {}),
    to: call.to ?? "+15551234567",
    from: call.from ?? "+15550001111",
    ...(call.metadata
      ? { metadata: { app_metadata: JSON.stringify(call.metadata) } }
      : {})
  });
  return harness.acceptSession(mark);
}
