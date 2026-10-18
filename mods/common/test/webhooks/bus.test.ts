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
import { FakeWebhookReceiver } from "@fonoster/conformance";
import { connect, NatsConnection } from "nats";
import {
  BusConnection,
  MemoryWebhookStore,
  WebhookDispatcher,
  busWebhookPublisher,
  callFailed,
  callStarted,
  nodeCallFailedEvent,
  parseBusEvent,
  resolveWorkspace,
  subscribeWebhookFanout
} from "../../src/webhooks";

/** An in-process bus with queue-group semantics (one subscriber per group gets each message). */
function memoryBus(): BusConnection {
  const subs: {
    subject: string;
    queue?: string;
    cb: (err: Error | null, msg: { data: Uint8Array }) => void;
  }[] = [];
  return {
    publish(subject, data) {
      const seen = new Set<string>();
      for (const s of subs.filter((x) => x.subject === subject)) {
        if (s.queue && seen.has(s.queue)) continue;
        if (s.queue) seen.add(s.queue);
        s.cb(null, { data });
      }
    },
    subscribe(subject, opts) {
      const s = { subject, queue: opts.queue, cb: opts.callback };
      subs.push(s);
      return { unsubscribe: () => subs.splice(subs.indexOf(s), 1) };
    }
  };
}

const call = {
  callRef: "c1",
  appRef: "support",
  from: "+15550001111",
  to: "+15550002222",
  direction: "inbound" as const
};

const tick = () => new Promise((r) => setTimeout(r, 20));

describe("@common/webhooks bus fan-out (task 2.2)", function () {
  let receiver: FakeWebhookReceiver;
  let dispatcher: WebhookDispatcher;

  beforeEach(async () => {
    receiver = await new FakeWebhookReceiver().start();
    dispatcher = new WebhookDispatcher({
      store: new MemoryWebhookStore(),
      allowInsecureUrls: true,
      allowedDestinations: ["127.0.0.1"],
      attemptTimeoutMs: 2000
    });
    dispatcher.createEndpoint({
      workspaceRef: "W",
      url: receiver.url,
      events: ["call.started", "call.failed"]
    });
  });
  afterEach(() => receiver.stop());

  it("delivers events published on the bus, once per queue group", async function () {
    const bus = memoryBus();
    const published: string[] = [];
    for (let i = 0; i < 2; i++)
      subscribeWebhookFanout(bus, {
        publish: (e) => dispatcher.publish(e),
        onPublished: (e) => published.push(e.id)
      });
    const event = callStarted("W", call);
    busWebhookPublisher(bus)(event);
    await tick();
    expect(published).to.deep.equal([event.id]);
    await dispatcher.runDue();
    expect(receiver.received.map((r) => r.json.id)).to.deep.equal([event.id]);
  });

  it("resolves the workspace from the app when the producer did not know it", async function () {
    const bus = memoryBus();
    subscribeWebhookFanout(bus, {
      publish: (e) => dispatcher.publish(e),
      workspaceOfApp: async (appRef) => (appRef === "support" ? "W" : undefined)
    });
    // A media node refusing a call no gateway claimed knows only the app.
    busWebhookPublisher(bus)(callFailed("", { ...call, reason: "node_error" }));
    busWebhookPublisher(bus)(
      callFailed("", { ...call, appRef: "unknown", reason: "node_error" })
    );
    await tick();
    await dispatcher.runDue();
    expect(receiver.received).to.have.length(1);
    expect(receiver.received[0].json).to.deep.include({
      type: "call.failed",
      workspaceRef: "W"
    });
  });

  it("drops malformed messages and unknown event types", async function () {
    const enc = (x: unknown) => new TextEncoder().encode(JSON.stringify(x));
    expect(parseBusEvent(new TextEncoder().encode("{nope"))).to.equal(
      undefined
    );
    expect(
      parseBusEvent(enc({ ...callStarted("W", call), type: "call.exploded" }))
    ).to.equal(undefined);
    expect(
      parseBusEvent(enc({ ...callStarted("W", call), id: "x y" }))
    ).to.equal(undefined);
    expect(parseBusEvent(enc(callStarted("W", call)))?.type).to.equal(
      "call.started"
    );
    expect(
      await resolveWorkspace(callStarted("default", { ...call, appRef: "" }))
    ).to.equal(undefined);
  });

  it("works over NATS", async function () {
    const url = process.env.CONFORMANCE_NATS_URL;
    if (!url) this.skip();
    const a: NatsConnection = await connect({ servers: url });
    const b: NatsConnection = await connect({ servers: url });
    try {
      const got: string[] = [];
      const queue = `test-${Date.now()}`;
      subscribeWebhookFanout(b, {
        queue,
        publish: (e) => {
          got.push(e.id);
          return dispatcher.publish(e);
        }
      });
      await b.flush();
      const event = callStarted("W", call);
      busWebhookPublisher(a)(event);
      await a.flush();
      for (let i = 0; i < 50 && !got.length; i++) await tick();
      expect(got).to.deep.equal([event.id]);
    } finally {
      await a.close();
      await b.close();
    }
  });
});

// M6: media nodes report unclaimed calls on their own subject; the control plane builds the
// webhook event and trusts nothing but the call's parties, app and a node reason.
describe("@common/webhooks node call.failed reports", function () {
  const enc = (o: unknown) => new TextEncoder().encode(JSON.stringify(o));
  const report = {
    type: "call.failed",
    nodeId: "n1",
    callRef: "c9",
    appRef: "support",
    from: "+15550001111",
    to: "+15550002222",
    direction: "inbound",
    reason: "node_error"
  };
  const SUBJECT = "media.n1.events.call-failed";

  it("builds a call.failed event whose workspace comes from the app", function () {
    const e = nodeCallFailedEvent(SUBJECT, enc(report))!;
    expect(e).to.deep.include({ type: "call.failed", workspaceRef: "" });
    expect(e.data).to.deep.equal({
      callRef: "c9",
      appRef: "support",
      from: "+15550001111",
      to: "+15550002222",
      direction: "inbound",
      reason: "node_error"
    });
    expect(e.id).to.match(/^evt_node_[0-9a-f]{32}$/);
    // A repeated report is the same event (delivered once).
    expect(nodeCallFailedEvent(SUBJECT, enc(report))!.id).to.equal(e.id);
  });

  it("ignores a workspace, an event type or extra data the node claims", function () {
    const e = nodeCallFailedEvent(
      SUBJECT,
      enc({ ...report, workspaceRef: "WS-victim", extra: "x" })
    )!;
    expect(e.workspaceRef).to.equal("");
    expect(e.data).not.to.have.property("extra");
    for (const type of ["call.started", "call.ended", "call_record.sealed"])
      expect(nodeCallFailedEvent(SUBJECT, enc({ ...report, type }))).to.equal(
        undefined
      );
  });

  it("refuses reports that do not name the subject's node, or are malformed", function () {
    const none = (subject: string, body: unknown) =>
      expect(nodeCallFailedEvent(subject, enc(body))).to.equal(undefined);
    none(SUBJECT, { ...report, nodeId: "n2" });
    none("media.n1.events.room-1", report);
    none("webhooks.events", report);
    none(SUBJECT, { ...report, appRef: "" });
    none(SUBJECT, { ...report, callRef: 7 });
    none(SUBJECT, { ...report, reason: "busy" });
    none(SUBJECT, { ...report, direction: "sideways" });
    none(SUBJECT, { ...report, to: "x".repeat(300) });
    expect(
      nodeCallFailedEvent(SUBJECT, new TextEncoder().encode("{"))
    ).to.equal(undefined);
  });
});
