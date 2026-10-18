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
import { connect, NatsConnection, StringCodec } from "nats";
import {
  Gateway,
  GatewayConfig,
  MemoryCallRecordSink,
  NullCallRecordSink,
  OUTBOUND_SUBJECT
} from "../src";
import {
  Catalog,
  KEYED_ADAPTERS_IDLE_MS,
  KEYED_ADAPTERS_MAX,
  WORKSPACE_KEYS_HOLD_MS
} from "../src/speech/Catalog";

// Long-lived gateway state stays bounded (in-memory state audit, phase 4): the call record sink
// without a record store, the speech catalog's workspace-key adapters, and the room watch of
// outbound calls that are never answered.

const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sc = StringCodec();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | undefined | false, ms = 3000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

describe("@gateway bounded state", function () {
  describe("call record sinks", function () {
    it("a gateway without a record store keeps nothing", function () {
      const gateway = new Gateway({
        config: { nats: { url: "nats://unused" }, providers: {} }
      });
      expect(gateway.record).to.be.instanceOf(NullCallRecordSink);
    });

    it("the memory sink keeps only the last ended calls (10k calls)", function () {
      const sink = new MemoryCallRecordSink(100);
      for (let i = 0; i < 10_000; i++) {
        const ref = `call-${i}`;
        sink.append(ref, { at: i, source: "event", message: { type: "x" } });
        sink.append(ref, { at: i, source: "event", message: { type: "y" } });
        sink.close(ref);
      }
      expect(sink.records.size).to.equal(100);
      expect(sink.closed.size).to.equal(100);
      expect(sink.records.has("call-9999")).to.equal(true);
      expect(sink.records.has("call-0")).to.equal(false);
      // Live calls are never dropped.
      sink.append("live", { at: 0, source: "event", message: { type: "x" } });
      for (let i = 0; i < 500; i++) sink.close(`more-${i}`);
      expect(sink.records.get("live")).to.have.length(1);
    });
  });

  describe("workspace key adapters", function () {
    const config = {
      nats: { url: "nats://x" },
      providers: {
        deepgram: {
          adapter: "deepgram" as const,
          capabilities: ["stt" as const, "tts" as const],
          credential: { value: "platform-key" }
        }
      }
    };
    const key = (adapter: unknown) =>
      (adapter as { options: { apiKey: string } }).options.apiKey;

    it("keeps at most KEYED_ADAPTERS_MAX adapters across 1000 key rotations", async function () {
      let rotation = 0;
      const catalog = new Catalog(config, undefined, {
        get: async () => `key-${rotation}`
      });
      for (; rotation < 1000; rotation++) {
        await catalog.prepare("WO1");
        expect(
          key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)
        ).to.equal(`key-${rotation}`);
      }
      expect(catalog.cached.adapters).to.equal(KEYED_ADAPTERS_MAX);
      expect(catalog.cached.workspaces).to.equal(1);
    });

    it("drops idle adapters and expired workspace keys", async function () {
      let now = 0;
      const catalog = new Catalog(config, undefined, {
        get: async (ws) => `key-${ws}`
      });
      catalog.now = () => now;
      await catalog.prepare("WO1");
      catalog.resolveVoice("deepgram/aura", "WO1");
      expect(catalog.cached).to.deep.equal({ workspaces: 1, adapters: 1 });
      now += KEYED_ADAPTERS_IDLE_MS + 1;
      await catalog.prepare("WO2");
      catalog.resolveVoice("deepgram/aura", "WO2");
      expect(catalog.cached.adapters).to.equal(1); // WO1's went idle
      now += WORKSPACE_KEYS_HOLD_MS + 1;
      // No call outlives the hold: WO1 and WO2 use the platform key again.
      expect(
        key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)
      ).to.equal("platform-key");
      expect(catalog.usesWorkspaceKey("deepgram", "WO2")).to.equal(false);
      await catalog.prepare("WO3");
      expect(catalog.cached.workspaces).to.equal(1);
    });

    it("never caches adapters built from a source whose keys must not be cached", async function () {
      const catalog = new Catalog(config, undefined, {
        cacheable: false,
        get: async () => "byo-key"
      });
      await catalog.prepare("WO1");
      expect(
        key(catalog.resolveVoice("deepgram/aura", "WO1")!.adapter)
      ).to.equal("byo-key");
      expect(catalog.cached.adapters).to.equal(0);
    });
  });

  describe("outbound calls never answered", function () {
    this.timeout(10_000);
    let nc: NatsConnection;
    let gateway: Gateway | undefined;
    let record: MemoryCallRecordSink;
    const failures: unknown[] = [];

    before(async function () {
      if (!NATS_URL) return this.skip();
      nc = await connect({ servers: NATS_URL });
    });
    after(async () => nc?.close());
    afterEach(async () => {
      await gateway?.stop();
      gateway = undefined;
    });

    const start = async () => {
      record = new MemoryCallRecordSink();
      failures.length = 0;
      const config: GatewayConfig = {
        nats: { url: NATS_URL! },
        providers: {},
        apps: [
          {
            ref: "a",
            url: "ws://127.0.0.1:9/never",
            protocol: "fonoster",
            signingSecret: "secret",
            speech: { voice: "fake/default", language: "en-US" }
          }
        ]
      };
      gateway = await new Gateway({
        config,
        nats: nc,
        record,
        sessions: false,
        outboundAnswerTimeoutMs: 400,
        webhooks: (e) => failures.push(e)
      }).start();
      return gateway;
    };
    const outbound = async (nodeId: string, roomRef: string) => {
      const reply = await nc.request(
        OUTBOUND_SUBJECT,
        sc.encode(
          JSON.stringify({ nodeId, roomRef, appRef: "a", callRef: roomRef })
        )
      );
      return JSON.parse(sc.decode(reply.data));
    };
    const failedReason = (callRef: string) =>
      record.records.get(callRef)?.find((e) => e.message.type === "call.failed")
        ?.message.reason;

    it("stops watching on room.ended before an answer", async function () {
      const gw = await start();
      const nodeId = `n-${Date.now()}`;
      const reply = await outbound(nodeId, "room-1");
      expect(reply).to.include({ type: "ack", gatewayRef: gw.gatewayRef });
      expect(gw.pendingOutboundCount).to.equal(1);
      nc.publish(
        `media.${nodeId}.events.room-1`,
        sc.encode(
          JSON.stringify({
            type: "room.ended",
            roomRef: "room-1",
            reason: "node_error"
          })
        )
      );
      await waitFor(() => gw.pendingOutboundCount === 0);
      expect(failedReason("room-1")).to.equal("node_error");
      expect(record.closed.has("room-1")).to.equal(true);
      expect(failures).to.have.length(1);
    });

    it("gives up when the node dies while ringing (x20)", async function () {
      const gw = await start();
      const nodeId = `n-${Date.now()}`;
      for (let i = 0; i < 20; i++) await outbound(nodeId, `ringing-${i}`);
      nc.publish(
        `media.${nodeId}.events.ringing-0`,
        sc.encode(JSON.stringify({ type: "call.progress", status: "ringing" }))
      );
      expect(gw.pendingOutboundCount).to.equal(20);
      // The node is killed: no answer, no failure, no room.ended.
      await waitFor(() => gw.pendingOutboundCount === 0, 2000);
      expect(failedReason("ringing-0")).to.equal("node_error");
      expect(failures).to.have.length(20);
    });
  });
});
