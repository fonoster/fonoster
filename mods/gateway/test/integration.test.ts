/*
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
import { NatsConnection, StringCodec, connect } from "nats";
import { FakeApp, FakesHarness, Peer } from "@fonoster/conformance";
import {
  AppConfig,
  Gateway,
  GatewayConfig,
  MemoryCallRecordSink,
  OUTBOUND_SUBJECT
} from "../src";
import { AudioFilterFactory } from "../src/filters";
import { z } from "zod";

// Gateway behaviour that needs more than one app or no app at all, so it is not expressed as a
// single-peer scenario: signatures, fallback, handoff, outbound calls and the call record.
// Needs NATS: set CONFORMANCE_NATS_URL.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sc = StringCodec();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function json(peer: Peer) {
  return peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);
}

async function waitFor<T>(fn: () => T | undefined, ms = 3000): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v !== undefined && v !== false) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

describe("@gateway integration", function () {
  this.timeout(15000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let other: FakeApp;
  let gateway: Gateway;
  let record: MemoryCallRecordSink;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async function () {
    harness = await new FakesHarness().start();
    other = await new FakeApp().start();
    harness.mediaNode.attachNats(nc);
    record = new MemoryCallRecordSink();
  });

  afterEach(async function () {
    await gateway?.stop();
    await harness?.stop();
    await other?.stop();
  });

  function app(
    ref: string,
    url: string,
    extra: Partial<AppConfig> = {}
  ): AppConfig {
    return {
      ref,
      url,
      flavor: "native",
      signingSecret: "secret",
      speech: { voice: "fake/default", language: "en-US" },
      ...extra
    };
  }

  async function start(apps: AppConfig[], extra: Partial<GatewayConfig> = {}) {
    const urls = harness.providerUrls;
    const config: GatewayConfig = {
      nats: { url: NATS_URL! },
      testMode: true,
      retry: { windowMs: 500, intervalMs: 100 },
      apps,
      providers: {
        fake: {
          adapter: "fake",
          capabilities: ["tts", "stt"],
          tts: { url: urls.tts },
          stt: { url: urls.stt }
        }
      },
      ...extra
    };
    gateway = await new Gateway({ config, nats: nc, record }).start();
  }

  const commands = () => harness.mediaNode.commands.map((c) => c.command.type);

  it("signs connections so a verifying app accepts them", async function () {
    harness.app.configure({ signingSecret: "secret", verifySignature: true });
    await start([app("a", harness.app.url)]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    expect(harness.app.attempts[0]).to.include({ accepted: true });
  });

  it("applies the fallback message when the app refuses a bad signature", async function () {
    harness.app.configure({ signingSecret: "rotated", verifySignature: true });
    await start([
      app("a", harness.app.url, {
        fallback: { message: "We are unavailable." }
      })
    ]);
    const since = Date.now();
    harness.mediaNode.offerCall();
    await waitFor(() => commands().includes("hangup"), 6000);
    expect(harness.app.attempts.every((a) => !a.accepted)).to.equal(true);
    expect(harness.mediaNode.outputAudioMs(since)).to.be.greaterThan(500);
    const types = [...record.records.values()][0].map((e) => e.message.type);
    expect(types).to.include.members(["app.connect_failed", "app.unreachable"]);
  });

  it("connects to the fallback app when the app is down", async function () {
    const downUrl = harness.app.url;
    await harness.app.stop();
    await start([
      app("a", downUrl, { fallback: { app: "b" } }),
      app("b", other.url, { numbers: ["+0"] })
    ]);
    harness.mediaNode.offerCall({ to: "+15550002222" });
    const { peer } = await other.nextConnection(5000);
    const startMsg = await waitFor(() =>
      json(peer).find((m) => m.type === "session.start")
    );
    expect(startMsg.appRef).to.equal("b");
    const unreachable = [...record.records.values()][0].find(
      (e) => e.message.type === "app.unreachable"
    );
    expect(unreachable?.message.url).to.equal(downUrl);
  });

  it("hands the call to another app with its payload and keeps the caller connected", async function () {
    await start([
      app("ivr", harness.app.url),
      app("billing", other.url, { numbers: ["+0"] })
    ]);
    harness.mediaNode.offerCall();
    const first = (await harness.app.nextConnection()).peer;
    await waitFor(() => json(first).find((m) => m.type === "session.start"));
    first.sendJson({
      type: "handoff",
      app: "billing",
      payload: { accountId: "42" }
    });

    await waitFor(() => json(first).find((m) => m.type === "session.end"));
    expect(json(first).find((m) => m.type === "session.end")).to.include({
      reason: "handoff"
    });
    const second = (await other.nextConnection()).peer;
    const start2 = await waitFor(() =>
      json(second).find((m) => m.type === "session.start")
    );
    expect(start2.handoff).to.deep.equal({ accountId: "42" });
    expect(commands()).not.to.include("hangup");
  });

  it("opens outbound sessions only when the callee answers", async function () {
    await start([app("a", harness.app.url)]);
    const room = await harness.mediaNode.handle({
      type: "room.create",
      id: "c1"
    });
    const reply = await nc.request(
      OUTBOUND_SUBJECT,
      sc.encode(
        JSON.stringify({
          nodeId: harness.mediaNode.nodeId,
          roomRef: room.roomRef,
          appRef: "a",
          to: "+15551234567"
        })
      )
    );
    expect(JSON.parse(sc.decode(reply.data))).to.include({ type: "ack" });
    expect(harness.app.attempts).to.have.length(0);

    await harness.mediaNode.handle({
      type: "participant.dial",
      id: "d1",
      roomRef: room.roomRef as string,
      to: "+15551234567"
    });
    const { peer } = await harness.app.nextConnection();
    const startMsg = await waitFor(() =>
      json(peer).find((m) => m.type === "session.start")
    );
    expect(startMsg.direction).to.equal("outbound");
    expect(commands()).not.to.include("answer");
  });

  it("never dials the app when the callee is busy", async function () {
    harness.mediaNode.configure({ dialOutcome: "busy" });
    await start([app("a", harness.app.url)]);
    const room = await harness.mediaNode.handle({
      type: "room.create",
      id: "c1"
    });
    await nc.request(
      OUTBOUND_SUBJECT,
      sc.encode(
        JSON.stringify({
          nodeId: harness.mediaNode.nodeId,
          roomRef: room.roomRef,
          appRef: "a",
          callRef: "out-1"
        })
      )
    );
    await harness.mediaNode.handle({
      type: "participant.dial",
      id: "d1",
      roomRef: room.roomRef as string,
      to: "+1"
    });
    await sleep(300);
    expect(harness.app.attempts).to.have.length(0);
    expect(record.records.get("out-1")?.[0].message).to.include({
      type: "call.progress",
      status: "busy"
    });
  });

  it("appends every message in both directions to the call record", async function () {
    await start([app("a", harness.app.url)]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({ type: "speak", id: "r1", text: "Bye.", last: true });
    await waitFor(() => json(peer).find((m) => m.type === "output.done"));
    peer.sendJson({ type: "hangup" });
    await waitFor(() => record.closed.size > 0);

    const entries = [...record.records.values()][0];
    const find = (source: string, type: string) =>
      entries.find((e) => e.source === source && e.message.type === type);
    expect(find("app", "speak")?.message).to.include({ id: "r1" });
    expect(find("gateway", "output.done")?.message).to.include({ id: "r1" });
    expect(find("gateway", "session.end")?.message).to.include({
      reason: "app_hangup"
    });
    expect(entries.every((e) => typeof e.at === "number")).to.equal(true);
  });

  it("feeds listen-only sockets both tracks as separate tagged frames", async function () {
    await start([
      app("a", harness.app.url, {
        listeners: [{ url: other.url, tracks: "both" }]
      })
    ]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    const listener = (await other.nextConnection()).peer;
    await waitFor(() => json(listener).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "speak",
      id: "r1",
      text: "Hello listener.",
      last: true
    });
    await waitFor(() => json(listener).find((m) => m.type === "output.done"));

    const tracks = new Set(
      listener.frames.items
        .filter((f) => f.kind === "binary")
        .map((f) => (f.data as Buffer)[0])
    );
    expect([...tracks].sort()).to.deep.equal([1, 2]);
    expect(json(listener).map((m) => m.type)).to.include.members([
      "output.started",
      "output.done"
    ]);
  });

  it("answers listener commands with read_only and keeps the call", async function () {
    await start([
      app("a", harness.app.url, { listeners: [{ url: other.url }] })
    ]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    const listener = (await other.nextConnection()).peer;
    await waitFor(() => json(listener).find((m) => m.type === "session.start"));
    listener.sendJson({ type: "hangup", id: "x1" });
    const error = await waitFor(() =>
      json(listener).find((m) => m.type === "error")
    );
    expect(error).to.include({ code: "read_only", relatesTo: "x1" });
    await sleep(200);
    expect(commands()).not.to.include("hangup");
    expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
    // Inbound only by default: no agent track.
    const tracks = new Set(
      listener.frames.items
        .filter((f) => f.kind === "binary")
        .map((f) => (f.data as Buffer)[0])
    );
    expect([...tracks]).to.deep.equal([1]);
  });

  it("drops an app that stops answering pings", async function () {
    await start([app("a", harness.app.url)], {
      keepalive: { pingIntervalMs: 100, idleTimeoutMs: 350 }
    });
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    // Stop reading the socket: no pongs, no frames.
    (
      peer as unknown as { socket: { _socket: { pause(): void } } }
    ).socket._socket.pause();
    await waitFor(() => commands().includes("hangup"), 3000);
    const types = [...record.records.values()][0].map((e) => e.message.type);
    expect(types).to.include("app.idle_timeout");
  });

  it("refuses oversized handoff payloads and keeps the session", async function () {
    await start([
      app("ivr", harness.app.url),
      app("billing", other.url, { numbers: ["+0"] })
    ]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "handoff",
      id: "h1",
      app: "billing",
      payload: { blob: "x".repeat(20000) }
    });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error")
    );
    expect(error).to.include({ code: "bad_message", relatesTo: "h1" });
    await sleep(200);
    expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
    expect(other.attempts).to.have.length(0);
  });

  it("feeds STT and turn detection filtered caller audio", async function () {
    let frames = 0;
    AudioFilterFactory.registerFilter("test-mute", {
      description: "silences everything (test only)",
      optionsSchema: z.object({}),
      publicOptionsSchema: z.object({}),
      create: () => ({
        name: "test-mute",
        delayMs: 0,
        process: (frame: Int16Array) => {
          frames++;
          return new Int16Array(frame.length);
        }
      })
    });
    await start([
      app("a", harness.app.url, { filters: [{ name: "test-mute" }] })
    ]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "speak",
      id: "r1",
      text: "The caller cannot interrupt this.",
      last: true
    });
    await waitFor(() => json(peer).find((m) => m.type === "output.started"));
    harness.mediaNode.callerSpeaks({ kind: "tone", ms: 600 });
    await waitFor(
      () =>
        json(peer).find(
          (m) => m.type === "output.done" || m.type === "output.interrupted"
        ),
      4000
    );
    // The tone was muted before turn detection, so it was not a barge-in.
    expect(json(peer).find((m) => m.type === "output.done")).to.include({
      id: "r1"
    });
    expect(frames).to.be.greaterThan(10);
  });

  it("continues unfiltered and records the failure when a filter cannot be created", async function () {
    await start([
      app("a", harness.app.url, { filters: [{ name: "does-not-exist" }] })
    ]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({ type: "speak", id: "r1", text: "Still here.", last: true });
    await waitFor(() => json(peer).find((m) => m.type === "output.done"));
    const failure = [...record.records.values()][0].find(
      (e) => e.message.type === "filter.failed"
    );
    expect(String(failure?.message.reason)).to.contain("does-not-exist");
  });

  it("hangs up when the app drops mid-call", async function () {
    await start([app("a", harness.app.url)]);
    harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.close();
    await waitFor(() => commands().includes("hangup"));
    const types = [...record.records.values()][0].map((e) => e.message.type);
    expect(types).to.include("app.dropped");
  });
});
