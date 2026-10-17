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
import { Msg, NatsConnection, StringCodec, Subscription } from "nats";
import { FrameLog, Peer } from "./Peer";

// The runner as a region's cell (role `region-cell`, contract `regions`): what the control plane
// sends on the cell's link (`region.<ref>.config`, `revoked`, `secrets.needed`,
// `endpoints.request`, `relay`) arrives as frames, and so do replies to the cell's requests.
// A sent frame names its subject relative to `region.<ref>.`:
//
//   send: { subject: heartbeat, type: region.heartbeat, ... }          publish
//   send: { subject: config.request, request: true, ... }              request; the reply is a frame
//   send: { respond: true, type: region.relay.chunk, ... }             reply to the last relay request
//
// The harness attaches the link once the cell has enrolled (a `control: {op: enroll}` step) and may
// push its own result frames (enrollment answers, relayed HTTP results) into the same log.

export const REGION_REQUEST_TIMEOUT_MS = 3000;

const sc = StringCodec();

const INCOMING = [
  "config",
  "revoked",
  "secrets.needed",
  "endpoints.request",
  "relay"
];

export class NatsRegionCellPeer implements Peer {
  readonly frames = new FrameLog();
  private nc?: NatsConnection;
  private regionRef?: string;
  private subs: Subscription[] = [];
  private lastRequest?: Msg;

  /** Starts listening on a cell link; earlier links stay attached (an old, revoked cell). */
  async attach(nc: NatsConnection, regionRef: string) {
    this.nc = nc;
    this.regionRef = regionRef;
    for (const subject of INCOMING)
      this.subs.push(
        nc.subscribe(`region.${regionRef}.${subject}`, {
          callback: (err, msg) => {
            if (err) return;
            if (subject === "relay") this.lastRequest = msg;
            this.push(JSON.parse(sc.decode(msg.data)));
          }
        })
      );
    await nc.flush();
  }

  /** A frame from the harness (enrollment answers, relayed reads). */
  push(data: Record<string, unknown>) {
    this.frames.push({ kind: "json", at: Date.now(), data });
  }

  sendJson(frame: Record<string, unknown>) {
    const { subject, request, respond, ...body } = frame;
    const payload = sc.encode(JSON.stringify(body));
    if (respond) {
      if (!this.lastRequest?.reply)
        throw new Error("respond: no relay request to answer");
      this.lastRequest.respond(payload);
      return;
    }
    if (!this.nc || !this.regionRef)
      throw new Error("the cell has no link yet (enroll first)");
    if (typeof subject !== "string" || !subject)
      throw new Error("a region-cell frame needs a subject");
    const full = `region.${this.regionRef}.${subject}`;
    if (!request) {
      this.nc.publish(full, payload);
      return;
    }
    this.nc
      .request(full, payload, { timeout: REGION_REQUEST_TIMEOUT_MS })
      .then((msg) => this.push(JSON.parse(sc.decode(msg.data))))
      .catch(() => this.push({ type: "no_reply", subject }));
  }

  sendBinary() {
    throw new Error("the region link carries JSON only");
  }

  close() {
    for (const s of this.subs) s.unsubscribe();
    this.subs = [];
    this.frames.markClosed();
  }
}
