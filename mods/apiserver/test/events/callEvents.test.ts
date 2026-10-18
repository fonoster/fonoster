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
import { randomUUID } from "crypto";
import { Point } from "@influxdata/influxdb-client";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { openCallRefs } from "../../src/events/callRefs";
import { subscribeCallEvents } from "../../src/events/nats";

// Routr's call events across apiserver replicas (ST-1, audit #3/#4): one queue group, so each
// event becomes one CDR point, and the call's ref is shared (KV), so a replica that restarts
// mid-call keeps tagging the call's points with the same ref. Needs a NATS with JetStream
// (CONFORMANCE_NATS_URL).

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const refOf = (p: Point) => /,ref=([^, ]+)/.exec(p.toLineProtocol())?.[1];
const callIdOf = (p: Point) => /,callId=([^, ]+)/.exec(p.toLineProtocol())?.[1];

describe("@apiserver/events Routr call events across replicas (NATS)", function () {
  this.timeout(30_000);
  const natsUrl = process.env.CONFORMANCE_NATS_URL;
  const bucket = `test_call_refs_${randomUUID().slice(0, 8)}`;
  let producer: NatsConnection;
  let replicas: { nc: NatsConnection; stop: () => void }[] = [];
  const points: Point[] = [];

  async function startReplicas(n: number) {
    for (let i = 0; i < n; i++) {
      const nc = await connect({ servers: natsUrl });
      const refs = await openCallRefs(
        nc,
        { warn: () => undefined },
        { bucket }
      );
      const stop = await subscribeCallEvents(nc, (p) => points.push(p), {
        refs,
        queue: `${bucket}-cdr`
      });
      replicas.push({ nc, stop });
    }
  }

  async function stopReplicas() {
    for (const r of replicas) {
      r.stop();
      await r.nc.close();
    }
    replicas = [];
  }

  async function until(check: () => boolean) {
    for (let i = 0; i < 100 && !check(); i++) await wait(50);
  }

  const publish = (subject: string, event: Record<string, unknown>) =>
    producer.publish(subject, JSON.stringify(event));

  before(async function () {
    if (!natsUrl) return this.skip();
    producer = await connect({ servers: natsUrl });
  });

  afterEach(async () => {
    await stopReplicas();
    points.length = 0;
  });

  after(async () => {
    if (!producer) return;
    const jsm = await producer.jetstreamManager();
    await jsm.streams.delete(`KV_${bucket}`).catch(() => undefined);
    await producer.close();
  });

  it("writes one point per event with one ref when three replicas consume a SIP call", async function () {
    await startReplicas(3);
    const callId = `sip-${randomUUID()}`;
    publish("routr.call.started", {
      callId,
      from: "+15550001111",
      to: "sip:+15550002222@sip.local",
      startTime: new Date().toISOString(),
      extraHeaders: { "X-Access-Key-Id": "WOacme" }
    });
    publish("routr.call.ended", {
      callId,
      endTime: new Date().toISOString(),
      hangupCause: "NORMAL_CLEARING"
    });
    await until(() => points.length >= 2);
    await wait(300); // any duplicate from another replica would land by now
    expect(points).to.have.length(2);
    expect(points.map(callIdOf)).to.deep.equal([callId, callId]);
    const refs = new Set(points.map(refOf));
    expect(refs.size).to.equal(1);
    expect([...refs][0]).to.be.a("string").and.not.empty;
  });

  it("keeps a call's ref when the replicas restart mid-call", async function () {
    const sipCall = `sip-${randomUUID()}`;
    const apiCall = `api-${randomUUID()}`;
    await startReplicas(3);
    publish("routr.call.started", {
      callId: sipCall,
      startTime: new Date().toISOString(),
      extraHeaders: { "X-Access-Key-Id": "WOacme" }
    });
    publish("routr.call.started", {
      callId: apiCall,
      startTime: new Date().toISOString(),
      extraHeaders: { "X-Access-Key-Id": "WOacme", "X-Call-Ref": "ref-api-1" }
    });
    await until(() => points.length >= 2);
    // Every replica goes away (a rollout); the calls end on new ones.
    await stopReplicas();
    await startReplicas(2);
    publish("routr.call.ended", {
      callId: sipCall,
      endTime: new Date().toISOString(),
      hangupCause: "NORMAL_CLEARING"
    });
    publish("routr.call.ended", {
      callId: apiCall,
      endTime: new Date().toISOString(),
      hangupCause: "NORMAL_CLEARING"
    });
    await until(() => points.length >= 4);
    await wait(300);
    expect(points).to.have.length(4);
    const byCall = (id: string) =>
      new Set(points.filter((p) => callIdOf(p) === id).map(refOf));
    expect([...byCall(apiCall)]).to.deep.equal(["ref-api-1"]);
    const sipRefs = [...byCall(sipCall)];
    expect(sipRefs).to.have.length(1);
    expect(sipRefs[0]).to.be.a("string");
  });
});
