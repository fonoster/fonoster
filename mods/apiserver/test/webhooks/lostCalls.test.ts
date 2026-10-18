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
  createLostCallSweep
} from "../../src/webhooks/lostCalls";

// call.ended for calls whose appbridge died mid-call (reason appbridge-lost), from the session
// registry's calls.* and gateways.* leases, with a fake clock.

const ANSWERED = {
  callRef: "call-1",
  gatewayRef: "gw-a",
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

function replica() {
  let t = 0;
  const emitted: Webhooks.WebhookEvent[] = [];
  const sweep = createLostCallSweep({
    emit: (e) => emitted.push(e),
    staleMs: 15_000,
    now: () => t
  });
  return {
    sweep,
    emitted,
    at: (ms: number) => (t = ms)
  };
}

describe("@apiserver/webhooks lost appbridge calls", function () {
  it("sends one call.ended (appbridge-lost) once the call and its appbridge go quiet", function () {
    const r = replica();
    r.sweep.onEntry(entry("gateways", "gw-a", { gatewayRef: "gw-a" }));
    r.sweep.onEntry(entry("calls", "call-1", ANSWERED));
    // Leases rewritten every 5 s: alive.
    for (const t of [5_000, 10_000, 15_000, 20_000]) {
      r.at(t);
      r.sweep.onEntry(entry("gateways", "gw-a", { gatewayRef: "gw-a" }));
      r.sweep.onEntry(entry("calls", "call-1", ANSWERED));
      expect(r.sweep.sweep()).to.be.empty;
    }
    // The appbridge dies at 20 s: nothing within the lease TTL, then call.ended.
    r.at(35_000);
    expect(r.sweep.sweep()).to.be.empty;
    r.at(35_001);
    const [event] = r.sweep.sweep();
    expect(event.type).to.equal("call.ended");
    expect(event.workspaceRef).to.equal(""); // resolved from the app by the fan-out
    expect(event.data).to.deep.equal({
      callRef: "call-1",
      appRef: "app-1",
      from: "+15550001",
      to: "+15550002",
      direction: "inbound",
      durationSeconds: 20,
      endReason: APPBRIDGE_LOST_REASON
    });
    // Once: later sweeps send nothing more.
    r.at(60_000);
    expect(r.sweep.sweep()).to.be.empty;
    expect(r.emitted).to.have.length(1);
  });

  it("sends nothing for a call that ended or whose appbridge is alive", function () {
    const r = replica();
    r.sweep.onEntry(entry("gateways", "gw-a", { gatewayRef: "gw-a" }));
    r.sweep.onEntry(entry("calls", "call-1", ANSWERED));
    r.sweep.onEntry(
      entry("calls", "call-2", { ...ANSWERED, callRef: "call-2" })
    );
    // call-1 ended normally (its appbridge sent call.ended and deleted the entry).
    r.sweep.onEntry(entry("calls", "call-1"));
    // call-2's entry stops being rewritten, but its appbridge is still alive.
    r.at(30_000);
    r.sweep.onEntry(entry("gateways", "gw-a", { gatewayRef: "gw-a" }));
    expect(r.sweep.sweep()).to.be.empty;
    expect(r.sweep.size()).to.equal(1);
  });

  it("sends nothing for a call that never reached an app", function () {
    const r = replica();
    const {
      appRef: _a,
      from: _f,
      to: _t,
      startedAt: _s,
      ...unanswered
    } = ANSWERED;
    r.sweep.onEntry(entry("calls", "call-1", unanswered));
    r.at(60_000);
    expect(r.sweep.sweep()).to.be.empty;
    expect(r.sweep.size()).to.equal(0);
  });

  it("gives the same event id on every replica, so each endpoint gets one delivery", function () {
    const store = new Webhooks.MemoryWebhookStore();
    const dispatcher = new Webhooks.WebhookDispatcher({ store });
    dispatcher.createEndpoint({
      workspaceRef: "WS",
      url: "https://hooks.example.com/fonoster",
      events: ["call.ended"]
    });
    const replicas = [replica(), replica()];
    for (const [i, r] of replicas.entries()) {
      r.sweep.onEntry(entry("gateways", "gw-a", { gatewayRef: "gw-a" }));
      r.sweep.onEntry(entry("calls", "call-1", ANSWERED));
      r.at(20_000 + i * 3_000); // the replicas sweep at different times
      r.sweep.sweep();
    }
    const [a, b] = replicas.map((r) => r.emitted[0]);
    expect(a.id).to.equal(b.id);
    const deliveries = [a, b].flatMap((e) =>
      dispatcher.plan({ ...e, workspaceRef: "WS" }).map((d) => d.id)
    );
    expect(new Set(deliveries).size).to.equal(1);
  });
});
