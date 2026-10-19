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
import { connect, NatsConnection, StringCodec } from "nats";
import {
  INCOMING_SUBJECT,
  NatsMediaControl,
  readTraceparent,
  traceHeaders
} from "../src/media/MediaControl";

// Trace propagation over NATS headers (add-platform 2.5): appbridge -> Roomr node on commands,
// Roomr node -> appbridge on call.incoming. Needs CONFORMANCE_NATS_URL.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const TP = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";
const sc = StringCodec();

describe("@appbridge/trace propagation over NATS", function () {
  let nc: NatsConnection;

  before(async function () {
    if (!NATS_URL) this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  it("sends the call's traceparent with media-control commands", async function () {
    const node = `trace-node-${Date.now()}`;
    let seen: string | undefined;
    const sub = nc.subscribe(`media.${node}.commands`, {
      callback: (_e, msg) => {
        seen = readTraceparent(msg.headers);
        const cmd = JSON.parse(sc.decode(msg.data));
        msg.respond(sc.encode(JSON.stringify({ type: "ack", id: cmd.id })));
      }
    });
    const media = new NatsMediaControl(nc);
    await media.command(node, { type: "hangup", id: "c1" }, TP);
    expect(seen).to.equal(TP);
    await media.command(node, { type: "hangup", id: "c2" });
    expect(seen).to.equal(undefined);
    sub.unsubscribe();
  });

  it("hands call.incoming's traceparent to the handler", async function () {
    const media = new NatsMediaControl(nc, { queue: `trace-${Date.now()}` });
    const got = new Promise<string | undefined>((resolve) => {
      const stop = media.onIncoming((_node, _event, tp) => {
        stop();
        resolve(tp);
      });
    });
    await nc.flush();
    await nc.request(
      INCOMING_SUBJECT,
      sc.encode(
        JSON.stringify({ type: "call.incoming", id: "i1", nodeId: "n" })
      ),
      { timeout: 2000, headers: traceHeaders(TP) }
    );
    expect(await got).to.equal(TP);
  });
});
