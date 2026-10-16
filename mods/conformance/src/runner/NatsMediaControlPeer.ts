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
import { NatsConnection, StringCodec, Subscription } from "nats";
import { INCOMING_SUBJECT } from "../fakes/FakeMediaNode";
import { FrameLog, Peer } from "./Peer";

// The runner as a media-control client (role `media-control-client`): commands go to a node as
// NATS requests and each reply arrives as a frame; the node's room events, heartbeats and
// `call.incoming` requests arrive as frames too (add-media-node/specs/media-control).

export const COMMAND_TIMEOUT_MS = 2000;

const sc = StringCodec();

export type NatsMediaControlPeerOptions = {
  nodeId: string;
  /** Claim call.incoming requests, as a gateway replica would (default true). */
  claimCalls?: boolean;
};

export class NatsMediaControlPeer implements Peer {
  readonly frames = new FrameLog();
  private subs: Subscription[] = [];

  constructor(
    private readonly nc: NatsConnection,
    private readonly options: NatsMediaControlPeerOptions
  ) {}

  /** Subscribes before the scenario starts, so no event is missed. */
  async open(): Promise<this> {
    const { nodeId } = this.options;
    const push = (data: Record<string, unknown>) =>
      this.frames.push({ kind: "json", at: Date.now(), data });
    this.subs.push(
      this.nc.subscribe(`media.${nodeId}.events.*`, {
        callback: (err, msg) => !err && push(JSON.parse(sc.decode(msg.data)))
      }),
      this.nc.subscribe(`media.${nodeId}.heartbeat`, {
        callback: (err, msg) => !err && push(JSON.parse(sc.decode(msg.data)))
      })
    );
    if (this.options.claimCalls !== false) {
      this.subs.push(
        this.nc.subscribe(INCOMING_SUBJECT, {
          callback: (err, msg) => {
            if (err) return;
            const event = JSON.parse(sc.decode(msg.data));
            if (event.nodeId !== nodeId) return;
            msg.respond(
              sc.encode(
                JSON.stringify({
                  type: "claimed",
                  id: event.id,
                  gatewayRef: "conformance"
                })
              )
            );
            push(event);
          }
        })
      );
    }
    await this.nc.flush();
    return this;
  }

  sendJson(command: Record<string, unknown>) {
    const subject = `media.${this.options.nodeId}.commands`;
    this.nc
      .request(subject, sc.encode(JSON.stringify(command)), {
        timeout: COMMAND_TIMEOUT_MS
      })
      .then((msg) =>
        this.frames.push({
          kind: "json",
          at: Date.now(),
          data: JSON.parse(sc.decode(msg.data))
        })
      )
      .catch(() =>
        // A sender treats a command with no reply within 2 s as failed.
        this.frames.push({
          kind: "json",
          at: Date.now(),
          data: { type: "no_reply", id: command.id }
        })
      );
  }

  sendBinary() {
    throw new Error("media-control carries no audio; audio is RTP");
  }

  close() {
    for (const s of this.subs) s.unsubscribe();
    this.subs = [];
    this.frames.markClosed();
  }
}
