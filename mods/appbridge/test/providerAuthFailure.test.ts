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
import { Webhooks } from "@fonoster/common";
import { buildVcon } from "@fonoster/callrecord";
import { FakesHarness, Peer } from "@fonoster/conformance";
import { AppConfig, AppBridge, MemoryCallRecordSink } from "../src";

// A vendor that rejects the workspace's key fails the call at once (#1146): the record says
// call.failed naming the catalog provider, the workspace gets the call.failed webhook, and the
// session ends with `error` whichever side found it. Needs NATS.
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

describe("@AppBridge a rejected vendor key", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let record: MemoryCallRecordSink;
  let webhooks: Webhooks.WebhookEvent[];

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });
  after(async () => nc?.close());

  beforeEach(async () => {
    harness = await new FakesHarness().start();
    harness.roomrNode.configure({ callerAudio: { kind: "tone", ms: 400 } });
    record = new MemoryCallRecordSink();
    webhooks = [];
  });

  afterEach(async () => {
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
  });

  // Two catalog providers served by the fake adapter, under names of their own: the record must
  // name these, not the adapter.
  async function start(app: Partial<AppConfig> = {}) {
    const urls = harness.providerUrls;
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
            speech: { voice: "voices/default", language: "en-US" },
            ...app
          }
        ],
        providers: {
          voices: {
            adapter: "fake",
            capabilities: ["tts"],
            tts: { url: urls.tts }
          },
          ears: {
            adapter: "fake",
            capabilities: ["stt"],
            stt: { url: urls.stt }
          }
        }
      },
      nats: nc,
      record,
      webhooks: (e) => webhooks.push(e)
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
  }

  const events = (callRef: string) =>
    (record.records.get(callRef) ?? []).map(
      (e) => e.message as Record<string, unknown>
    );
  const ended = (callRef: string) =>
    waitFor(() => events(callRef).find((m) => m.type === "call.ended"));
  const failedWebhooks = () =>
    webhooks
      .filter((w) => w.type === "call.failed")
      .map((w) => (w.data as { reason: string }).reason);

  it("a rejected voice key: fatal error, call.failed naming the provider, webhook, ends with error", async () => {
    harness.tts.configure({ rejectKey: true });
    await start();
    const { callRef } = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({ type: "speak", id: "s1", text: "Hello.", last: true });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error" && m.relatesTo === "s1")
    );
    expect(error).to.include({
      fatal: true,
      message: "voices rejected the credentials (HTTP 401)"
    });
    expect((await ended(callRef)).reason).to.equal("error");
    expect(events(callRef).find((m) => m.type === "call.failed")).to.deep.equal(
      {
        type: "call.failed",
        reason: "provider_auth_failed",
        provider: "voices",
        kind: "tts"
      }
    );
    expect(json(peer).find((m) => m.type === "session.end")).to.include({
      reason: "error"
    });
    expect(failedWebhooks()).to.deep.equal(["provider_auth_failed"]);
  });

  it("a rejected recognition key: call.failed naming the provider, webhook, ends with error", async () => {
    harness.stt.configure({ rejectKey: true });
    await start();
    const { callRef } = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    // Recognition starts with the app's first speech command.
    peer.sendJson({ type: "speak", id: "s1", text: "Hello.", last: true });
    expect((await ended(callRef)).reason).to.equal("error");
    expect(
      json(peer).find((m) => m.type === "error" && m.fatal === true)
    ).to.include({
      message: "speech recognition: ears rejected the credentials (HTTP 401)"
    });
    expect(events(callRef).find((m) => m.type === "call.failed")).to.include({
      reason: "provider_auth_failed",
      provider: "ears",
      kind: "stt"
    });
    expect(failedWebhooks()).to.deep.equal(["provider_auth_failed"]);
  });

  it("an Autopilot hangup with failure ends with error, like the speech paths", async () => {
    await start({ type: "AUTOPILOT" });
    const { callRef } = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "hangup",
      failure: {
        reason: "provider_auth_failed",
        provider: "together",
        kind: "llm"
      }
    });
    expect((await ended(callRef)).reason).to.equal("error");
    expect(events(callRef).find((m) => m.type === "call.failed")).to.include({
      reason: "provider_auth_failed",
      provider: "together",
      kind: "llm"
    });
    expect(failedWebhooks()).to.deep.equal(["provider_auth_failed"]);
  });

  it("any other app's hangup with failure is a plain hangup", async () => {
    await start();
    const { callRef } = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "hangup",
      failure: { reason: "provider_auth_failed", provider: "together" }
    });
    expect((await ended(callRef)).reason).to.equal("app_hangup");
    expect(events(callRef).find((m) => m.type === "call.failed")).to.equal(
      undefined
    );
    expect(failedWebhooks()).to.deep.equal([]);
  });

  // The fallback message plays only when no app could be reached, and that is recorded first:
  // a voice that then rejects the key still ends a failed call, never a completed one.
  it("a rejected key on the fallback message: the call is failed (app_unreachable) and hung up", async () => {
    harness.tts.configure({ rejectKey: true });
    await start({
      url: "ws://127.0.0.1:1/",
      fallback: { message: "We can't take your call right now." }
    });
    const { callRef } = await harness.roomrNode.offerCall();
    expect((await ended(callRef)).reason).to.equal("error");
    expect(harness.tts.requests).to.equal(1);
    const entries = record.records.get(callRef)!;
    expect(buildVcon(callRef, entries, { region: "test" }).vcon.fonoster)
      .to.have.property("status")
      .that.equals("failed");
    expect(failedWebhooks()).to.deep.equal(["app_unreachable"]);
  });
});
