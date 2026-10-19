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
  callSubject,
  AppConfig,
  AppBridge,
  AppBridgeConfig,
  MemoryCallRecordSink,
  OUTBOUND_SUBJECT
} from "../src";
import { AudioFilterFactory } from "../src/filters";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Registry as RegistryNs } from "@fonoster/common";
import { z } from "zod";

// AppBridge behaviour that needs more than one app or no app at all, so it is not expressed as a
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

describe("@appbridge integration", function () {
  this.timeout(15000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let other: FakeApp;
  let appbridge: AppBridge;
  let record: MemoryCallRecordSink;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async function () {
    harness = await new FakesHarness().start();
    other = await new FakeApp().start();
    harness.roomrNode.attachNats(nc);
    record = new MemoryCallRecordSink();
  });

  afterEach(async function () {
    await appbridge?.stop();
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
      protocol: "fonoster",
      signingSecret: "secret",
      speech: { voice: "fake/default", language: "en-US" },
      ...extra
    };
  }

  async function start(
    apps: AppConfig[],
    extra: Partial<AppBridgeConfig> = {}
  ) {
    const urls = harness.providerUrls;
    const config: AppBridgeConfig = {
      nats: { url: NATS_URL! },
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
    appbridge = await new AppBridge({ config, nats: nc, record }).start();
  }

  const commands = () => harness.roomrNode.commands.map((c) => c.command.type);

  it("signs connections so a verifying app accepts them", async function () {
    harness.app.configure({ signingSecret: "secret", verifySignature: true });
    await start([app("a", harness.app.url)]);
    harness.roomrNode.offerCall();
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
    harness.roomrNode.offerCall();
    await waitFor(() => commands().includes("hangup"), 6000);
    expect(harness.app.attempts.every((a) => !a.accepted)).to.equal(true);
    expect(harness.roomrNode.outputAudioMs(since)).to.be.greaterThan(500);
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
    harness.roomrNode.offerCall({ to: "+15550002222" });
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
      app("ivr", harness.app.url, { workspaceRef: "W1" }),
      app("billing", other.url, { numbers: ["+0"], workspaceRef: "W1" })
    ]);
    harness.roomrNode.offerCall();
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

  it("never merges a call into a live call with the same callRef (RV-B7)", async function () {
    await start([app("a", harness.app.url)]);
    harness.roomrNode.offerCall({ callRef: "dup" });
    const first = (await harness.app.nextConnection()).peer;
    const start1 = await waitFor(() =>
      json(first).find((m) => m.type === "session.start")
    );
    const second = harness.roomrNode.offerCall({ callRef: "dup" });
    const peer2 = (await harness.app.nextConnection()).peer;
    const start2 = await waitFor(() =>
      json(peer2).find((m) => m.type === "session.start")
    );
    expect(start1.callRef).to.equal("dup");
    expect(start2.callRef).to.equal(second.roomRef);
  });

  it("hangs up over the call subject only for the call's own workspace (RV-B12)", async function () {
    await start([
      app("none", harness.app.url, { numbers: ["+1000"] }),
      app("mine", other.url, { numbers: ["+2000"], workspaceRef: "W1" })
    ]);
    const hangup = async (callRef: string, accountSid?: string) =>
      JSON.parse(
        sc.decode(
          (
            await nc.request(
              callSubject(callRef),
              sc.encode(JSON.stringify({ type: "hangup", accountSid })),
              { timeout: 2000 }
            )
          ).data
        )
      );
    harness.roomrNode.offerCall({
      to: "+1000",
      appRef: "none",
      callRef: "c-none"
    });
    const p1 = (await harness.app.nextConnection()).peer;
    await waitFor(() => json(p1).find((m) => m.type === "session.start"));
    expect(await hangup("c-none", "W1")).to.include({ code: "not_found" });

    harness.roomrNode.offerCall({
      to: "+2000",
      appRef: "mine",
      callRef: "c-mine"
    });
    const p2 = (await other.nextConnection()).peer;
    await waitFor(() => json(p2).find((m) => m.type === "session.start"));
    expect(await hangup("c-mine")).to.include({ code: "not_found" });
    expect(await hangup("c-mine", "W2")).to.include({ code: "not_found" });
    expect(await hangup("c-mine", "W1")).to.include({ type: "ack" });
  });

  it("opens outbound sessions only when the callee answers", async function () {
    await start([app("a", harness.app.url)]);
    const room = await harness.roomrNode.handle({
      type: "room.create",
      id: "c1"
    });
    const reply = await nc.request(
      OUTBOUND_SUBJECT,
      sc.encode(
        JSON.stringify({
          nodeId: harness.roomrNode.nodeId,
          roomRef: room.roomRef,
          appRef: "a",
          to: "+15551234567"
        })
      )
    );
    expect(JSON.parse(sc.decode(reply.data))).to.include({ type: "ack" });
    expect(harness.app.attempts).to.have.length(0);

    await harness.roomrNode.handle({
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

  it("records callee_hangup when the dialed party hangs up (the app sees caller_hangup)", async function () {
    await start([app("a", harness.app.url)]);
    const room = await harness.roomrNode.handle({
      type: "room.create",
      id: "c1"
    });
    await nc.request(
      OUTBOUND_SUBJECT,
      sc.encode(
        JSON.stringify({
          nodeId: harness.roomrNode.nodeId,
          roomRef: room.roomRef,
          appRef: "a",
          callRef: "out-2",
          to: "+15551234567"
        })
      )
    );
    await harness.roomrNode.handle({
      type: "participant.dial",
      id: "d1",
      roomRef: room.roomRef as string,
      to: "+15551234567"
    });
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    harness.roomrNode.calleeHangup(room.roomRef as string);
    const end = await waitFor(() =>
      json(peer).find((m) => m.type === "session.end")
    );
    expect(end.reason).to.equal("caller_hangup");
    const ended = await waitFor(() =>
      record.records
        .get("out-2")
        ?.map((e) => e.message)
        .find((m) => m.type === "call.ended")
    );
    expect(ended).to.include({ reason: "callee_hangup" });
  });

  it("never dials the app when the callee is busy", async function () {
    harness.roomrNode.configure({ dialOutcome: "busy" });
    await start([app("a", harness.app.url)]);
    const room = await harness.roomrNode.handle({
      type: "room.create",
      id: "c1"
    });
    await nc.request(
      OUTBOUND_SUBJECT,
      sc.encode(
        JSON.stringify({
          nodeId: harness.roomrNode.nodeId,
          roomRef: room.roomRef,
          appRef: "a",
          callRef: "out-1"
        })
      )
    );
    await harness.roomrNode.handle({
      type: "participant.dial",
      id: "d1",
      roomRef: room.roomRef as string,
      to: "+1"
    });
    await sleep(300);
    expect(harness.app.attempts).to.have.length(0);
    const entries = record.records.get("out-1")!.map((e) => e.message);
    // The minimal record carries the parties (call.started), then the progress and the failure.
    expect(entries[0]).to.include({ type: "call.started", to: "" });
    expect(entries[1]).to.include({ type: "call.progress", status: "busy" });
  });

  it("appends every message in both directions to the call record", async function () {
    await start([app("a", harness.app.url)]);
    harness.roomrNode.offerCall();
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
    expect(find("appbridge", "output.done")?.message).to.include({ id: "r1" });
    expect(find("appbridge", "session.end")?.message).to.include({
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
    harness.roomrNode.offerCall();
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
    harness.roomrNode.offerCall();
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
    harness.roomrNode.offerCall();
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

  for (const [name, target] of [
    ["another workspace", "W2"],
    ["no workspace", undefined]
  ] as const) {
    it(`refuses a handoff to an app in ${name} (RV-B3)`, async function () {
      await start([
        app("ivr", harness.app.url, { workspaceRef: "W1" }),
        app("theirs", other.url, { numbers: ["+0"], workspaceRef: target })
      ]);
      harness.roomrNode.offerCall();
      const { peer } = await harness.app.nextConnection();
      await waitFor(() => json(peer).find((m) => m.type === "session.start"));
      peer.sendJson({ type: "handoff", id: "h1", app: "theirs", payload: {} });
      const error = await waitFor(() =>
        json(peer).find((m) => m.type === "error")
      );
      expect(error).to.include({ code: "bad_message", relatesTo: "h1" });
      await sleep(200);
      expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
      expect(other.attempts).to.have.length(0);
    });
  }

  for (const [name, transfer] of [
    [
      "a reserved header",
      { to: "+15551234567", headers: { "X-Dod-Number": "+15550009999" } }
    ],
    [
      "another workspace's key",
      { to: "+15551234567", headers: { "x-access-key-id": "W2" } }
    ],
    [
      "an app ref header",
      { to: "+15551234567", headers: { "X-App-Ref": "theirs" } }
    ],
    [
      "CR/LF in a header",
      { to: "+15551234567", headers: { "X-Note": "a\r\nVia: x" } }
    ],
    [
      "a non-X header",
      { to: "+15551234567", headers: { Contact: "<sip:x@y>" } }
    ],
    ["CR/LF in the target", { to: "+1555\r\nVia: x" }],
    ["URI delimiters in the target", { to: "sip:a@b;transport=tcp" }]
  ] as const) {
    it(`refuses a transfer with ${name} and sends nothing to the node (H11)`, async function () {
      await start([app("ivr", harness.app.url, { workspaceRef: "W1" })]);
      harness.roomrNode.offerCall();
      const { peer } = await harness.app.nextConnection();
      await waitFor(() => json(peer).find((m) => m.type === "session.start"));
      peer.sendJson({ type: "transfer", id: "t1", ...transfer });
      const error = await waitFor(() =>
        json(peer).find((m) => m.type === "error")
      );
      expect(error).to.include({ code: "bad_message", relatesTo: "t1" });
      await sleep(100);
      expect(commands()).to.not.include("transfer");
      expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
    });
  }

  it("transfers with the app's custom headers and the call's own number and workspace (H11)", async function () {
    await start([app("ivr", harness.app.url, { workspaceRef: "W1" })]);
    harness.roomrNode.offerCall({ from: "+15550001111", to: "+15550002222" });
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "transfer",
      id: "t1",
      to: "+15551234567",
      headers: { "X-Customer-Id": "c-42" }
    });
    const transfer = await waitFor(() =>
      harness.roomrNode.commands
        .map((c) => c.command)
        .find((c) => c.type === "transfer")
    );
    expect(transfer).to.include({ to: "+15551234567" });
    expect(transfer.headers).to.deep.equal({
      "X-Customer-Id": "c-42",
      "X-Dod-Number": "+15550002222",
      "X-Access-Key-Id": "W1"
    });
  });

  it("refuses oversized handoff payloads and keeps the session", async function () {
    await start([
      app("ivr", harness.app.url, { workspaceRef: "W1" }),
      app("billing", other.url, { numbers: ["+0"], workspaceRef: "W1" })
    ]);
    harness.roomrNode.offerCall();
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
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "speak",
      id: "r1",
      text: "The caller cannot interrupt this.",
      last: true
    });
    await waitFor(() => json(peer).find((m) => m.type === "output.started"));
    harness.roomrNode.callerSpeaks({ kind: "tone", ms: 600 });
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
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({ type: "speak", id: "r1", text: "Still here.", last: true });
    await waitFor(() => json(peer).find((m) => m.type === "output.done"));
    const failure = [...record.records.values()][0].find(
      (e) => e.message.type === "filter.failed"
    );
    expect(String(failure?.message.reason)).to.contain("does-not-exist");
  });

  it("records app notes and refuses oversized ones", async function () {
    await start([app("a", harness.app.url)]);
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({
      type: "record.note",
      id: "n1",
      data: { kind: "turn", firstTokenMs: 420 }
    });
    peer.sendJson({
      type: "record.note",
      id: "n2",
      data: { blob: "x".repeat(17000) }
    });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error")
    );
    expect(error).to.include({ code: "bad_message", relatesTo: "n2" });
    const note = [...record.records.values()][0].find(
      (e) => e.message.type === "record.note"
    );
    expect(note).to.deep.include({ source: "app" });
    expect(note?.message.data).to.deep.equal({
      kind: "turn",
      firstTokenMs: 420
    });
  });

  it("records turn decisions with their estimate and labels the turn", async function () {
    harness.stt.configure({
      script: [{ atMs: 400, text: "What are your hours?" }]
    });
    await start([app("a", harness.app.url)]);
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    peer.sendJson({ type: "listen.update" });
    await waitFor(() => json(peer).find((m) => m.type === "turn.ended"), 5000);
    peer.sendJson({
      type: "speak",
      id: "r1",
      text: "Nine to five.",
      last: true
    });
    await waitFor(() => json(peer).find((m) => m.type === "output.started"));
    const entries = () => [...record.records.values()][0];
    const label = await waitFor(
      () => entries().find((e) => e.message.type === "turn.label"),
      4000
    );
    expect(label.message).to.include({ label: "ok" });
    const decision = entries().find(
      (e) =>
        e.message.type === "turn.decision" && e.message.event === "turn.ended"
    );
    expect(decision?.message).to.include({
      detector: "baseline@1",
      policy: "default@2"
    });
    expect(decision?.message.eot).to.equal(1);
  });

  it("plays a retired voice's replacement and records the use", async function () {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "registry-")),
      "registry.json"
    );
    const registry = new RegistryNs.Registry({
      store: new RegistryNs.FileRegistryStore(file)
    });
    registry.addProvider({
      id: "fake",
      adapter: "fake",
      capabilities: ["tts", "stt"],
      credentialRef: "none"
    });
    registry.addModel({ id: "fake/tts", type: "tts", features: ["streaming"] });
    registry.addVoice({ id: "fake/old", models: ["fake/tts"] });
    registry.addVoice({ id: "fake/new", models: ["fake/tts"] });
    registry.deprecate("voice", "fake/old", "fake/new", "2027-01-31");
    registry.retire("voice", "fake/old");

    await start(
      [
        app("a", harness.app.url, {
          speech: { voice: "fake/old", language: "en-US" }
        })
      ],
      { registry: { file } }
    );
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({ type: "speak", id: "r1", text: "Hello.", last: true });
    peer.sendJson({ type: "speak", id: "r2", text: "Again.", last: true });
    peer.sendJson({
      type: "speak",
      id: "r3",
      text: "Who?",
      last: true,
      voice: "fake/unknown"
    });
    await waitFor(
      () => json(peer).find((m) => m.type === "output.done" && m.id === "r2"),
      5000
    );

    expect(harness.tts.synthesized.map((s) => s.voice)).to.deep.equal([
      "new",
      "new"
    ]);
    expect(json(peer).find((m) => m.type === "error")).to.include({
      code: "invalid_catalog_id",
      relatesTo: "r3"
    });
    const used = [...record.records.values()][0].filter(
      (e) => e.message.type === "provider.retired_used"
    );
    expect(used).to.have.length(1);
    expect(used[0].message).to.include({
      id: "fake/old",
      replacement: "fake/new"
    });
  });

  it("opens STT with the app's catalog STT model and hints, adding listen.update hints", async function () {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "registry-")),
      "registry.json"
    );
    const registry = new RegistryNs.Registry({
      store: new RegistryNs.FileRegistryStore(file)
    });
    registry.addProvider({
      id: "fake",
      adapter: "fake",
      capabilities: ["tts", "stt"],
      credentialRef: "none"
    });
    registry.addModel({ id: "fake/tts", type: "tts", features: ["streaming"] });
    registry.addModel({
      id: "fake/stt-2",
      type: "stt",
      features: ["streaming"]
    });
    registry.addVoice({ id: "fake/default", models: ["fake/tts"] });
    await start(
      [
        app("a", harness.app.url, {
          speech: {
            voice: "fake/default",
            language: "en-US",
            sttModel: "fake/stt-2",
            hints: ["Fonoster", "Routr"]
          }
        })
      ],
      { registry: { file } }
    );
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    peer.sendJson({ type: "listen.update" });
    const first = await waitFor(
      () => harness.stt.streams[0]?.hints && harness.stt.streams[0]
    );
    expect(first.model).to.equal("stt-2");
    expect(first.hints).to.deep.equal(["Fonoster", "Routr"]);
    peer.sendJson({ type: "listen.update", hints: ["routr", "Acme"] });
    await waitFor(() => harness.stt.streams[0].hints?.includes("Acme"));
    expect(harness.stt.streams[0].hints).to.deep.equal([
      "Fonoster",
      "Routr",
      "Acme"
    ]);
  });

  it("reports an app STT model that is not in the catalog", async function () {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "registry-")),
      "registry.json"
    );
    const registry = new RegistryNs.Registry({
      store: new RegistryNs.FileRegistryStore(file)
    });
    registry.addProvider({
      id: "fake",
      adapter: "fake",
      capabilities: ["tts", "stt"],
      credentialRef: "none"
    });
    registry.addModel({ id: "fake/tts", type: "tts", features: ["streaming"] });
    registry.addVoice({ id: "fake/default", models: ["fake/tts"] });
    await start(
      [
        app("a", harness.app.url, {
          speech: {
            voice: "fake/default",
            language: "en-US",
            sttModel: "fake/missing"
          }
        })
      ],
      { registry: { file } }
    );
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    peer.sendJson({ type: "listen.update" });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error")
    );
    expect(error).to.include({ code: "invalid_catalog_id", fatal: false });
    expect(harness.stt.streams).to.have.length(0);
  });

  it("hangs up when the app drops mid-call", async function () {
    await start([app("a", harness.app.url)]);
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.close();
    await waitFor(() => commands().includes("hangup"));
    const types = [...record.records.values()][0].map((e) => e.message.type);
    expect(types).to.include("app.dropped");
  });

  it("does not record a drop when the app hangs up and closes at once", async function () {
    // Pipecat's auto_hang_up: the hang-up request, then the socket closes before Roomr's ack.
    await start([app("a", harness.app.url)]);
    harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({ type: "hangup" });
    peer.close();
    await waitFor(() => commands().includes("hangup"));
    await waitFor(() =>
      [...record.records.values()][0]
        .map((e) => e.message.type)
        .includes("call.ended")
    );
    const types = [...record.records.values()][0].map((e) => e.message.type);
    expect(types).not.to.include("app.dropped");
    expect(commands().filter((c) => c === "hangup")).to.have.length(1);
  });
});
