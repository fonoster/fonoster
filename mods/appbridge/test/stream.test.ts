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
import { NatsConnection, connect } from "nats";
import { FakesHarness, Peer } from "@fonoster/conformance";
import {
  AppBridge,
  AppBridgeConfig,
  appMetadata,
  MemoryCallRecordSink,
  parseDurationMs,
  recordEndReason,
  sessionEndReason,
  userPart,
  validateConfig
} from "../src";
import { checkHealth } from "../src/healthcheck";

// The per-call control stream (redesign-roomr 5.3, 5.6, 5.9, 13.3, 15.1, 15.2): what AppBridge
// does on the session endpoint, against the fake Roomr node. The first block is pure; the rest
// needs NATS (CONFORMANCE_NATS_URL), which AppBridge still uses for records and webhooks.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | undefined | false, ms = 3000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v !== undefined && v !== false) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

function json(peer: Peer) {
  return peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);
}

describe("@appbridge control stream: causes and config", function () {
  it("[APB-028] maps every Ended cause to its session.end reason, unknown ones to error (5.9)", function () {
    const table: Record<string, string> = {
      caller_hangup: "caller_hangup",
      callee_hangup: "caller_hangup",
      removed: "app_hangup",
      max_duration: "timeout",
      media_timeout: "error",
      node_error: "error",
      app_gone: "error",
      busy: "error",
      no_answer: "error",
      rejected: "error",
      something_new: "error",
      "": "error"
    };
    for (const [cause, reason] of Object.entries(table))
      expect(sessionEndReason(cause), cause).to.equal(reason);
    expect(sessionEndReason("removed", { transferred: true })).to.equal(
      "transfer"
    );
  });

  it("[APB-028] keeps the callee hang-up, the media timeout and node errors in the record", function () {
    expect(recordEndReason("callee_hangup")).to.equal("callee_hangup");
    expect(recordEndReason("media_timeout")).to.equal("media_timeout");
    expect(recordEndReason("node_error")).to.equal("node_error");
    expect(recordEndReason("app_gone")).to.equal("error");
    expect(recordEndReason("removed", { transferred: true })).to.equal(
      "transfer"
    );
  });

  it("[APB-030] reads durations and checks the session keys", function () {
    expect(parseDurationMs("15s")).to.equal(15_000);
    expect(parseDurationMs("1h")).to.equal(3_600_000);
    expect(parseDurationMs("250ms")).to.equal(250);
    expect(parseDurationMs(400)).to.equal(400);
    expect(parseDurationMs("soon")).to.be.NaN;
    const base = { nats: { url: "nats://x" }, providers: {} };
    expect(
      validateConfig({
        ...base,
        mediaTimeout: "15s",
        session: { listen: "0.0.0.0:50071", drainWait: "10m", keepalive: 10000 }
      })
    ).to.deep.equal([]);
    expect(
      validateConfig({
        ...base,
        mediaTimeout: "later",
        session: { listen: "50071" }
      })
    ).to.have.length(2);
  });

  it("[APB-029] reads an outbound call's parties and metadata from Start", function () {
    expect(userPart("sip:+15551234567@carrier;transport=tcp")).to.equal(
      "+15551234567"
    );
    expect(userPart("+15551234567")).to.equal("+15551234567");
    expect(
      appMetadata({ app_ref: "a", app_metadata: '{"order":42}' })
    ).to.deep.equal({ order: 42 });
    expect(appMetadata({ app_ref: "a", tenant: "t1" })).to.deep.equal({
      tenant: "t1"
    });
  });
});

describe("@appbridge control stream against the fake node", function () {
  this.timeout(15000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let record: MemoryCallRecordSink;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });
  after(async () => nc?.close());

  beforeEach(async function () {
    harness = await new FakesHarness().start();
    harness.roomrNode.configure({ callerAudio: { kind: "tone", ms: 200 } });
    record = new MemoryCallRecordSink();
  });

  afterEach(async function () {
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
  });

  async function start(extra: Partial<AppBridgeConfig> = {}) {
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        apps: [
          {
            ref: "a",
            url: harness.app.url,
            protocol: "fonoster",
            signingSecret: "secret",
            speech: { voice: "fake/default", language: "en-US" }
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        },
        ...extra
      },
      nats: nc,
      record,
      sessions: false
    }).start();
    harness.roomrNode.configure({
      endpoint: appbridge.sessionEndpoint,
      appRef: "a"
    });
    return appbridge;
  }

  const commands = () => harness.roomrNode.commands.map((c) => c.command.type);
  const recorded = (callRef: string, type: string) =>
    (record.records.get(callRef) ?? [])
      .map((e) => e.message)
      .find((m) => m.type === type);

  it("[APB-027] answers on the stream only after session.start, with its RTP endpoint, and hears the caller", async function () {
    await start();
    const call = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    await harness.roomrNode.answered(call.callRef);
    expect(commands()[0]).to.equal("answer");
    const answer = harness.roomrNode.commands[0].command as unknown as {
      media: { ip: string; port: number; codec: string };
    };
    expect(answer.media).to.include({ ip: "127.0.0.1", codec: "L16/16000" });
    expect(call.sip).to.deep.equal([180, 200]);
    // The caller's tone reaches the app as audio frames.
    await waitFor(() => peer.frames.items.some((f) => f.kind === "binary"));
    harness.roomrNode.callerHangup(call.callRef);
    const end = await waitFor(() =>
      json(peer).find((m) => m.type === "session.end")
    );
    expect(end.reason).to.equal("caller_hangup");
  });

  it("[APB-027] rejects a call that names no app with 404 and opens no socket", async function () {
    await start();
    const call = await harness.roomrNode.offerCall({ appRef: "missing" });
    const ended = await harness.roomrNode.ended(call.callRef);
    expect(ended).to.deep.include({ cause: "rejected", sipStatus: 404 });
    expect(call.sip).to.deep.equal([180, 404]);
    expect(harness.app.attempts).to.have.length(0);
  });

  for (const [cause, reason] of [
    ["max_duration", "timeout"],
    ["node_error", "error"],
    ["something_new", "error"]
  ] as const) {
    it(`[APB-005] ends the session with ${reason} when the node ends the call with ${cause}`, async function () {
      await start();
      const call = await harness.roomrNode.offerCall();
      const { peer } = await harness.app.nextConnection();
      await waitFor(() => json(peer).find((m) => m.type === "session.start"));
      await harness.roomrNode.answered(call.callRef);
      harness.roomrNode.endCall(cause, undefined, call.callRef);
      const end = await waitFor(() =>
        json(peer).find((m) => m.type === "session.end")
      );
      expect(end.reason).to.equal(reason);
    });
  }

  it("[APB-005] ends the call when the node's RTP stops for mediaTimeout, sealed with media_timeout (15.1)", async function () {
    await start({ mediaTimeout: 400 });
    const call = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    await harness.roomrNode.answered(call.callRef);
    harness.roomrNode.stopMedia(call.callRef);
    const end = await waitFor(
      () => json(peer).find((m) => m.type === "session.end"),
      3000
    );
    expect(end.reason).to.equal("error");
    expect(commands()).to.include("hangup");
    expect(recorded(call.callRef, "call.ended")).to.include({
      reason: "media_timeout"
    });
  });

  it("[APB-005] ends the session with error and records node_error when the stream breaks without Ended", async function () {
    await start();
    const call = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    await harness.roomrNode.answered(call.callRef);
    harness.roomrNode.crash();
    const end = await waitFor(() =>
      json(peer).find((m) => m.type === "session.end")
    );
    expect(end.reason).to.equal("error");
    await waitFor(() => recorded(call.callRef, "call.ended"));
    expect(recorded(call.callRef, "call.ended")).to.include({
      reason: "node_error"
    });
  });

  it("[APB-029] opens an answered outbound call's session from Start.metadata.app_ref and sends Ready", async function () {
    await start();
    const call = await harness.roomrNode.placeCall({
      appRef: "a",
      to: "+15551234567",
      metadata: { app_metadata: JSON.stringify({ order: 42 }) }
    });
    const { peer } = await harness.app.nextConnection();
    const startMsg = await waitFor(() =>
      json(peer).find((m) => m.type === "session.start")
    );
    expect(startMsg).to.deep.include({
      direction: "outbound",
      to: "+15551234567",
      callRef: call.callRef,
      metadata: { order: 42 }
    });
    await harness.roomrNode.answered(call.callRef);
    expect(commands()).to.include("ready");
    expect(commands()).to.not.include("answer");
  });

  it("[APB-030] serves grpc.health.v1 on the Session port: SERVING, then NOT_SERVING while draining with live calls kept (13.3, 15.2)", async function () {
    const gw = await start();
    expect(await checkHealth(gw.sessionEndpoint)).to.equal(true);
    const call = await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    let drained = false;
    const draining = gw.drain(5000).then(() => (drained = true));
    await sleep(100);
    expect(await checkHealth(gw.sessionEndpoint)).to.equal(false);
    // The live call keeps running while the replica drains.
    await sleep(300);
    expect(drained).to.equal(false);
    expect(json(peer).some((m) => m.type === "session.end")).to.equal(false);
    harness.roomrNode.callerHangup(call.callRef);
    await draining;
    expect(gw.calls.size).to.equal(0);
  });

  it("[APB-030] ends what is left when the drain's maximum wait passes", async function () {
    const gw = await start();
    await harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    await gw.drain(200);
    await gw.stop();
    appbridge = undefined;
    const end = await waitFor(() =>
      json(peer).find((m) => m.type === "session.end")
    );
    expect(end.reason).to.equal("error");
    expect(commands()).to.include("hangup");
  });
});
