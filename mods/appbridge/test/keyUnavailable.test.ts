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
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { z } from "zod";
import { FakesHarness, Peer } from "@fonoster/conformance";
import { AppConfig, AppBridge, MemoryCallRecordSink } from "../src";
import { AudioFilterFactory } from "../src/filters";

// An unreadable workspace key never falls back to the platform key (remove-platform-key-fallback).
// Needs NATS.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | undefined | false, ms = 5000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

const json = (peer: Peer) =>
  peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);

AudioFilterFactory.registerFilter("test-nc-key", {
  description: "pass-through noise cancelling on a keyed fake provider",
  optionsSchema: z.object({}),
  publicOptionsSchema: z.object({}),
  provider: "fakenc",
  create: () => ({
    name: "test-nc-key",
    delayMs: 0,
    process: (f: Int16Array) => f
  })
});

describe("@AppBridge unreadable workspace keys", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let record: MemoryCallRecordSink;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });
  after(async () => nc?.close());

  beforeEach(async () => {
    harness = await new FakesHarness().start();
    harness.roomrNode.configure({ callerAudio: { kind: "tone", ms: 400 } });
    record = new MemoryCallRecordSink();
  });

  afterEach(async () => {
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
  });

  /** Providers whose lookup fails; every other lookup answers "no key". */
  async function start(app: Partial<AppConfig>, failing: string[]) {
    const urls = harness.providerUrls;
    const keyed = { keyless: false, credential: { value: "platform-key" } };
    appbridge = await new AppBridge({
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        retry: { windowMs: 300, intervalMs: 100 },
        apps: [
          {
            ref: "a",
            url: harness.app.url,
            protocol: "fonoster",
            signingSecret: "s",
            workspaceRef: "ws-1",
            speech: { voice: "fake/default", language: "en-US" },
            ...app
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            ...keyed,
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          },
          fake2: {
            adapter: "fake",
            capabilities: ["tts"],
            ...keyed,
            tts: { url: urls.tts }
          },
          fakenc: { adapter: "fake", capabilities: ["nc"], ...keyed }
        }
      },
      nats: nc,
      record,
      workspaceKeys: {
        get: async (_ws: string, provider: string) => {
          if (failing.includes(provider)) throw new Error("key store down");
          return undefined;
        }
      }
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
  }

  const events = (callRef: string) =>
    (record.records.get(callRef) ?? []).map(
      (e) => e.message as Record<string, unknown>
    );

  it("rejects the call before answering when the app's voice key can't be read", async () => {
    await start({}, ["fake"]);
    const { callRef } = await harness.roomrNode.offerCall();
    await waitFor(
      () => harness.roomrNode.sipStatuses(callRef).includes(503),
      8000
    );
    expect(harness.roomrNode.sipStatuses(callRef)).to.not.include(200);
    const failed = await waitFor(() =>
      events(callRef).find((m) => m.type === "call.failed")
    );
    expect(failed).to.include({ reason: "key_unavailable", provider: "fake" });
    expect(harness.tts.synthesized).to.have.length(0);
  });

  it("proceeds on the platform key when the workspace has no key", async () => {
    await start({}, []);
    await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
  });

  it("answers speak with key_unavailable for a voice whose key can't be read", async () => {
    await start({}, ["fake2"]);
    const { callRef } = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "speak",
      id: "s1",
      text: "Hello.",
      voice: "fake2/default",
      last: true
    });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error" && m.relatesTo === "s1")
    );
    expect(error).to.include({ code: "key_unavailable", fatal: false });
    expect(harness.tts.synthesized).to.have.length(0);
    harness.roomrNode.callerHangup(callRef);
  });

  it("rejects the call when a noise-cancelling filter's key can't be read", async () => {
    await start({ filters: [{ name: "test-nc-key" }] }, ["fakenc"]);
    const { callRef } = await harness.roomrNode.offerCall();
    await waitFor(
      () => harness.roomrNode.sipStatuses(callRef).includes(503),
      8000
    );
    const failed = await waitFor(() =>
      events(callRef).find((m) => m.type === "call.failed")
    );
    expect(failed).to.include({
      reason: "key_unavailable",
      provider: "fakenc"
    });
  });
});
