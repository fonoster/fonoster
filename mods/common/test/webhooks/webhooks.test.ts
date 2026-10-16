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
import {
  MemoryWebhookStore,
  WebhookDispatcher,
  WebhookError,
  callEnded,
  callFailed,
  callRecordSealed,
  callStarted,
  providerDeprecated,
  verifyWebhook
} from "../../src/webhooks";

const call = {
  callRef: "c1",
  appRef: "support",
  from: "+15550001111",
  to: "+15550002222",
  direction: "inbound" as const
};

describe("@common/webhooks", function () {
  let receiver: FakeWebhookReceiver;
  let clock: number;
  let dispatcher: WebhookDispatcher;
  let store: MemoryWebhookStore;

  beforeEach(async () => {
    receiver = await new FakeWebhookReceiver().start();
    clock = Date.now();
    store = new MemoryWebhookStore();
    dispatcher = new WebhookDispatcher({
      store,
      allowInsecureUrls: true,
      allowedDestinations: ["127.0.0.1"],
      now: () => clock,
      attemptTimeoutMs: 2000
    });
  });
  afterEach(() => receiver.stop());

  it("delivers only the subscribed event types", async function () {
    dispatcher.createEndpoint({
      workspaceRef: "W",
      url: receiver.url,
      events: ["call.ended"]
    });
    dispatcher.publish(callStarted("W", call));
    dispatcher.publish(
      callEnded("W", {
        ...call,
        durationSeconds: 42,
        endReason: "caller_hangup"
      })
    );
    dispatcher.publish(
      callEnded("OTHER", {
        ...call,
        durationSeconds: 1,
        endReason: "app_hangup"
      })
    );
    await dispatcher.runDue();
    expect(receiver.received.map((r) => r.json.type)).to.deep.equal([
      "call.ended"
    ]);
    expect(receiver.received[0].json).to.deep.include({ workspaceRef: "W" });
    expect(receiver.received[0].json.data).to.deep.equal({
      ...call,
      durationSeconds: 42,
      endReason: "caller_hangup"
    });
  });

  it("refuses plain HTTP endpoints", function () {
    const strict = new WebhookDispatcher({ store: new MemoryWebhookStore() });
    expect(() =>
      strict.createEndpoint({
        workspaceRef: "W",
        url: "http://hooks.example.com/fonoster",
        events: ["call.ended"]
      })
    ).to.throw(WebhookError, "webhook URLs must use HTTPS");
  });

  it("points the retired assistant webhook events to their replacements", function () {
    const d = new WebhookDispatcher({ store: new MemoryWebhookStore() });
    expect(() =>
      d.createEndpoint({
        workspaceRef: "W",
        url: "https://hooks.example.com/fonoster",
        events: ["conversation.ended"] as never
      })
    ).to.throw(
      WebhookError,
      "retired event types: conversation.ended (use call.ended or call_record.sealed)"
    );
  });

  it("builds the v1 payloads from the spec", function () {
    const failed = callFailed("W", {
      callRef: "c2",
      from: "+1",
      to: "+2",
      direction: "outbound",
      reason: "busy"
    });
    expect(failed).to.deep.include({ type: "call.failed", workspaceRef: "W" });
    expect(failed.data.reason).to.equal("busy");
    const sealed = callRecordSealed("W", {
      callRef: "c1",
      version: 1,
      recordUrl: "https://api.fonoster.com/v1/records/c1"
    });
    expect(Object.keys(sealed.data)).to.deep.equal([
      "callRef",
      "version",
      "recordUrl"
    ]);
    const dep = providerDeprecated("W", {
      id: "deepgram/nova-2",
      replacement: "deepgram/nova-3",
      retireOn: "2027-01-31"
    });
    expect(dep.data).to.deep.equal({
      id: "deepgram/nova-2",
      replacement: "deepgram/nova-3",
      retireOn: "2027-01-31"
    });
    expect(dep.id).to.match(/^evt_/);
  });

  it("signs deliveries so receivers can verify them, and rejects stale ones", async function () {
    const endpoint = dispatcher.createEndpoint({
      workspaceRef: "W",
      url: receiver.url,
      events: ["call.started"]
    });
    dispatcher.publish(callStarted("W", call));
    await dispatcher.runDue();
    const r = receiver.received[0];
    const now = Math.floor(clock / 1000);
    expect(verifyWebhook(r.body, r.headers, endpoint.secret, now)).to.equal(
      true
    );
    expect(verifyWebhook(r.body, r.headers, "whsec_wrong", now)).to.equal(
      false
    );
    expect(
      verifyWebhook(r.body, r.headers, endpoint.secret, now + 600)
    ).to.equal(false);
  });

  it("signs with both secrets during a rotation window, then only the new one", async function () {
    const endpoint = dispatcher.createEndpoint({
      workspaceRef: "W",
      url: receiver.url,
      events: ["call.started"]
    });
    const fresh = dispatcher.rotateSecret(endpoint.id, 60_000);
    dispatcher.publish(callStarted("W", call));
    await dispatcher.runDue();
    const during = receiver.received[0];
    const t = Math.floor(clock / 1000);
    expect(
      verifyWebhook(during.body, during.headers, endpoint.secret, t)
    ).to.equal(true);
    expect(verifyWebhook(during.body, during.headers, fresh, t)).to.equal(true);
    clock += 120_000;
    dispatcher.publish(callStarted("W", call));
    await dispatcher.runDue();
    const after = receiver.received[1];
    const t2 = Math.floor(clock / 1000);
    expect(
      verifyWebhook(after.body, after.headers, endpoint.secret, t2)
    ).to.equal(false);
    expect(verifyWebhook(after.body, after.headers, fresh, t2)).to.equal(true);
  });

  it("retries with growing gaps and the same id until the endpoint recovers", async function () {
    dispatcher.createEndpoint({
      workspaceRef: "W",
      url: receiver.url,
      events: ["call.ended"]
    });
    receiver.respond({ status: 503 }, { status: 503 });
    const [delivery] = dispatcher.publish(
      callEnded("W", { ...call, durationSeconds: 3, endReason: "app_hangup" })
    );
    const gaps: number[] = [];
    let last = clock;
    for (let i = 0; i < 5 && store.deliveries()[0].status === "pending"; i++) {
      await dispatcher.runDue();
      const d = store.deliveries()[0];
      if (d.status !== "pending") break;
      gaps.push(d.nextAttemptAt - last);
      last = d.nextAttemptAt;
      clock = d.nextAttemptAt;
    }
    const final = store.deliveries().find((d) => d.id === delivery.id)!;
    expect(final).to.include({
      status: "succeeded",
      attempts: 3,
      lastStatus: 200
    });
    expect(new Set(receiver.received.map((r) => r.json.id)).size).to.equal(1);
    expect(gaps[1]).to.be.greaterThan(gaps[0]);
  });

  it("marks a delivery failed after the retry period and resends it with the same id", async function () {
    const failing = new WebhookDispatcher({
      store,
      allowInsecureUrls: true,
      allowedDestinations: ["127.0.0.1"],
      now: () => clock,
      firstDelayMs: 1000,
      retryPeriodMs: 5000
    });
    failing.createEndpoint({
      workspaceRef: "W",
      url: receiver.url,
      events: ["call.ended"]
    });
    // 1 s, 2 s, then 4 s would pass the 5 s retry period: three failed attempts, then failed.
    receiver.respond({ status: 500 }, { status: 500 }, { status: 500 });
    failing.publish(
      callEnded("W", { ...call, durationSeconds: 3, endReason: "app_hangup" })
    );
    for (let i = 0; i < 10 && store.deliveries()[0].status === "pending"; i++) {
      await failing.runDue();
      clock = store.deliveries()[0].nextAttemptAt;
    }
    const failed = store.deliveries()[0];
    expect(failed).to.include({ status: "failed", attempts: 3 });
    const resent = await failing.resend(failed.id);
    expect(resent.status).to.equal("succeeded");
    const last = receiver.received[receiver.received.length - 1];
    expect(last.json.id).to.equal(failed.event.id);
    expect(receiver.received).to.have.length(4);
    expect(store.deliveries()[0].status).to.equal("succeeded");
  });
});
