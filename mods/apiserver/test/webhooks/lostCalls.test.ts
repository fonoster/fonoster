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
import { Sessions, Webhooks } from "@fonoster/common";
import { expect } from "chai";
import {
  APPBRIDGE_LOST_REASON,
  createLostCalls
} from "../../src/webhooks/lostCalls";

// call.ended for calls whose AppBridge died mid-call (reason appbridge-lost, redesign-roomr 15.4):
// the node ends the call with cause app_gone; the control plane sends call.ended unless the
// call's AppBridge ended it itself (it deletes its calls.* entry). Fake clock, no grace wait.

const ANSWERED = {
  callRef: "call-1",
  bridgeRef: "gw-a",
  nodeId: "n1",
  roomRef: "r1",
  direction: "inbound",
  appRef: "app-1",
  from: "+15550001",
  to: "+15550002",
  startedAt: new Date(0).toISOString()
};

const entry = (
  kind: Sessions.SessionKind,
  id: string,
  value?: Record<string, unknown>
): Sessions.SessionEntry => ({ kind, id, value, writtenAt: new Date() });

function replica(options: { forgetMs?: number } = {}) {
  let t = 0;
  const emitted: Webhooks.WebhookEvent[] = [];
  const lost = createLostCalls({
    emit: (e) => emitted.push(e),
    graceMs: 0,
    forgetMs: options.forgetMs,
    now: () => t
  });
  return {
    lost,
    emitted,
    at: (ms: number) => (t = ms)
  };
}

describe("@apiserver/webhooks lost appbridge calls", function () {
  it("sends one call.ended (appbridge-lost) when the node ends the call with app_gone", async function () {
    const r = replica();
    r.lost.onEntry(entry("calls", "call-1", ANSWERED));
    // AppBridge rewrites its entry every 5 s, then dies at 20 s; the node reports app_gone.
    for (const t of [5_000, 10_000, 15_000, 20_000]) {
      r.at(t);
      r.lost.onEntry(entry("calls", "call-1", ANSWERED));
    }
    r.at(21_000);
    const event = (await r.lost.onAppGone("call-1"))!;
    expect(event.type).to.equal("call.ended");
    expect(event.workspaceRef).to.equal(""); // resolved from the app by the fan-out
    expect(event.data).to.deep.equal({
      callRef: "call-1",
      appRef: "app-1",
      from: "+15550001",
      to: "+15550002",
      direction: "inbound",
      durationSeconds: 21,
      endReason: APPBRIDGE_LOST_REASON
    });
    // Once: a repeated app_gone sends nothing more.
    expect(await r.lost.onAppGone("call-1")).to.equal(undefined);
    expect(r.emitted).to.have.length(1);
  });

  it("never after AppBridge's own: a call AppBridge ended (entry deleted) gets nothing", async function () {
    const r = replica();
    r.lost.onEntry(entry("calls", "call-1", ANSWERED));
    // call-1 ended normally: its AppBridge sent call.ended and deleted the entry.
    r.lost.onEntry(entry("calls", "call-1"));
    expect(await r.lost.onAppGone("call-1")).to.equal(undefined);
    expect(r.emitted).to.have.length(0);
  });

  it("waits the grace period for AppBridge's own end before sending", async function () {
    const emitted: Webhooks.WebhookEvent[] = [];
    const lost = createLostCalls({ emit: (e) => emitted.push(e), graceMs: 50 });
    lost.onEntry(entry("calls", "call-1", ANSWERED));
    lost.onEntry(entry("calls", "call-2", { ...ANSWERED, callRef: "call-2" }));
    const one = lost.onAppGone("call-1");
    const two = lost.onAppGone("call-2");
    // call-1's AppBridge ends the call itself within the grace period.
    lost.onEntry(entry("calls", "call-1"));
    expect(await one).to.equal(undefined);
    expect((await two)?.data).to.include({ callRef: "call-2" });
    expect(emitted).to.have.length(1);
    lost.stop();
  });

  it("sends nothing for a call that never reached an app, or one it never saw", async function () {
    const r = replica();
    const {
      appRef: _a,
      from: _f,
      to: _t,
      startedAt: _s,
      ...unanswered
    } = ANSWERED;
    r.lost.onEntry(entry("calls", "call-1", unanswered));
    expect(await r.lost.onAppGone("call-1")).to.equal(undefined);
    expect(await r.lost.onAppGone("unknown")).to.equal(undefined);
    expect(r.emitted).to.have.length(0);
  });

  it("keeps the entry of a dead AppBridge (its lease expires unseen) and forgets it after forgetMs", async function () {
    const r = replica({ forgetMs: 60_000 });
    r.lost.onEntry(entry("calls", "call-1", ANSWERED));
    r.lost.onEntry(
      entry("calls", "call-2", { ...ANSWERED, callRef: "call-2" })
    );
    r.at(30_000); // past the registry TTL: the entries expired, no delete event came
    expect((await r.lost.onAppGone("call-1"))?.data).to.include({
      callRef: "call-1"
    });
    r.at(61_000);
    r.lost.forget();
    expect(r.lost.size()).to.equal(0);
    expect(await r.lost.onAppGone("call-2")).to.equal(undefined);
  });

  it("gives the same event id on every replica, so each endpoint gets one delivery", async function () {
    const store = new Webhooks.MemoryWebhookStore();
    const dispatcher = new Webhooks.WebhookDispatcher({ store });
    dispatcher.createEndpoint({
      workspaceRef: "WS",
      url: "https://hooks.example.com/fonoster",
      events: ["call.ended"]
    });
    const replicas = [replica(), replica()];
    for (const [i, r] of replicas.entries()) {
      r.lost.onEntry(entry("calls", "call-1", ANSWERED));
      r.at(20_000 + i * 3_000); // the replicas see it at different times
      await r.lost.onAppGone("call-1");
    }
    const [a, b] = replicas.map((r) => r.emitted[0]);
    expect(a.id).to.equal(b.id);
    const deliveries = [a, b].flatMap((e) =>
      dispatcher.plan({ ...e, workspaceRef: "WS" }).map((d) => d.id)
    );
    expect(new Set(deliveries).size).to.equal(1);
  });
});
