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
import { FakeMediaNode } from "../src";

// Needs a NATS server; set CONFORMANCE_NATS_URL (e.g. nats://127.0.0.1:4222) to run.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

describe("@conformance/FakeMediaNode over NATS", function () {
  let nc: NatsConnection;
  let node: FakeMediaNode;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async function () {
    await node?.stop();
    await nc?.close();
  });

  it("answers media-control requests and publishes events", async function () {
    node = new FakeMediaNode({ nodeId: `test-${Date.now()}` });
    const subjects = node.attachNats(nc);
    const sc = StringCodec();
    const events: Record<string, unknown>[] = [];
    nc.subscribe(subjects.events, { callback: (_e, m) => events.push(JSON.parse(sc.decode(m.data))) });
    await nc.flush();

    const { roomRef } = node.offerCall();
    const reply = await nc.request(subjects.commands, sc.encode(JSON.stringify({ type: "hold", id: "c7", roomRef })));
    expect(JSON.parse(sc.decode(reply.data))).to.deep.equal({ type: "ack", id: "c7" });
    await nc.flush();
    expect(events[0]).to.include({ type: "call.incoming", roomRef });
  });
});
