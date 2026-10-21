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
import { connect, NatsConnection } from "nats";
import { FakeRoomrNode } from "./FakeRoomrNode";
import { NodeContext, NodeDriver, StartedNode } from "./GoNodeDriver";
import { NodeOverrides } from "./nodeConfig";
import { SipSide } from "./sip";
import { VirtualSip } from "./VirtualSip";

// The fake Roomr node under the Roomr suite: each node is a FakeRoomrNode with its own NATS
// connection (through the suite's fault proxy, as the Go node's), and the SIP side is one
// VirtualSip shared by every node, as the caller bot is.

export class FakeNodeDriver implements NodeDriver {
  readonly kind = "fake" as const;
  private readonly virtual = new VirtualSip();
  private nodes: { node: FakeRoomrNode; nc: NatsConnection }[] = [];

  /** `connectNats` replaces the NATS client (tests of the harness itself use an in-memory bus). */
  constructor(
    private readonly connectNats: (url: string) => Promise<NatsConnection> = (
      url
    ) =>
      connect({
        servers: url,
        reconnectTimeWait: 100,
        maxReconnectAttempts: -1
      })
  ) {}

  get sip(): SipSide {
    return this.virtual;
  }

  async prepare() {
    // Nothing to start: the SIP side is in memory.
  }

  async start(
    index: number,
    overrides: NodeOverrides,
    ctx: NodeContext
  ): Promise<StartedNode> {
    const nc = await this.connectNats(ctx.natsUrl);
    const node = await new FakeRoomrNode({
      nodeRef: `fake-${index}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      nc,
      sessionEndpoint: ctx.sessionEndpoint,
      sip: this.virtual,
      overrides
    }).start();
    this.nodes[index] = { node, nc };
    return {
      index,
      nodeRef: node.nodeRef,
      controlAddr: node.controlAddr,
      sipAddr: node.sipAddr
    };
  }

  kill(index: number) {
    this.nodes[index]?.node.kill();
  }

  sigterm(index: number) {
    this.nodes[index]?.node.sigterm();
  }

  alive(index: number): boolean {
    const n = this.nodes[index]?.node;
    return !!n && !n.exited;
  }

  files(): string[] {
    // The fake node keeps audio in memory only.
    return [];
  }

  output(): string {
    return "";
  }

  async stop() {
    for (const n of this.nodes) {
      if (!n) continue;
      await n.node.stop();
      await n.nc.close().catch(() => undefined);
    }
    this.nodes = [];
    await this.virtual.stop();
  }
}
