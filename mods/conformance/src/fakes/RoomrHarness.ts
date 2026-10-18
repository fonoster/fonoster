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
import { NatsConnection } from "nats";
import { Harness } from "../runner/Harness";
import { NatsMediaControlPeer } from "../runner/NatsMediaControlPeer";
import { CallerAction, Setup } from "../scenario/types";
import { EndReason, FakeNatsRoomr } from "./FakeNatsRoomr";

/**
 * Runs `media-control` scenarios (role `media-control-client`) against a Roomr node over NATS.
 * Here the node is the FakeNatsRoomr and `caller` steps drive it directly; for the Go node the
 * same scenarios run with a harness whose `caller` is a SIP caller bot.
 */
export class RoomrHarness implements Harness {
  readonly node: FakeNatsRoomr;
  private claimCalls = true;

  constructor(
    private readonly nc: NatsConnection,
    node?: FakeNatsRoomr
  ) {
    this.node =
      node ??
      new FakeNatsRoomr({ nodeId: `mc-${Date.now()}`, answerAfterMs: 20 });
  }

  async start(): Promise<this> {
    this.node.attachNats(this.nc);
    return this;
  }

  async stop() {
    await this.node.stop();
  }

  async setup(setup: Setup) {
    const media = setup.media ?? {};
    this.node.configure({
      ...(media.dialOutcome ? { dialOutcome: media.dialOutcome } : {}),
      ...(media.heartbeatMs !== undefined
        ? { heartbeatMs: media.heartbeatMs }
        : {}),
      ...(media.maxRooms !== undefined ? { maxRooms: media.maxRooms } : {}),
      claimTimeoutMs: 200
    });
    this.claimCalls = media.claimCalls !== false;
  }

  /** The runner's peer: a media-control client on this node's subjects. */
  connect(): Promise<NatsMediaControlPeer> {
    return new NatsMediaControlPeer(this.nc, {
      nodeId: this.node.nodeId,
      claimCalls: this.claimCalls
    }).open();
  }

  caller(action: CallerAction) {
    if (action.call)
      this.node.offerCall({
        from: action.call.from,
        to: action.call.to,
        appRef: action.call.appRef,
        callRef: action.call.callRef
      });
    if (action.dtmf) for (const digit of action.dtmf) this.node.pressKey(digit);
    if (action.hangup) this.node.callerHangup();
    if (action.drop)
      this.node.dropRoom(
        action.drop.reason as EndReason,
        action.drop.sipStatus
      );
    if (action.nodeCrash) this.node.crash();
  }

  measure(name: string): unknown {
    switch (name) {
      case "media.sip":
        return this.node.sipStatuses();
      case "media.held":
        return this.node.isHeld();
      case "media.commands":
        return this.node.commands.map((c) => c.command);
      default:
        return undefined;
    }
  }
}
