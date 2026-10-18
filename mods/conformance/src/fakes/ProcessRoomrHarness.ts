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
import { RoomrBinaries, RoomrProcess } from "./RoomrProcess";

/**
 * Runs media-control scenarios against a real Roomr node process (the Go node). `caller` steps
 * drive the SIP caller bot, so calls arrive as real INVITEs with RTP.
 */
export class ProcessRoomrHarness implements Harness {
  private dialOutcome?: "answered" | "busy" | "no_answer" | "failed";
  readonly media: RoomrProcess;
  private claimCalls = true;

  constructor(
    private readonly nc: NatsConnection,
    bins: RoomrBinaries
  ) {
    this.media = new RoomrProcess(bins);
  }

  async setup(setup: Setup) {
    if (setup.media?.heartbeatMs !== undefined)
      this.media.heartbeatMs = setup.media.heartbeatMs;
    this.media.maxRooms = setup.media?.maxRooms;
    this.claimCalls = setup.media?.claimCalls !== false;
    this.dialOutcome = setup.media?.dialOutcome;
  }

  async connect(): Promise<NatsMediaControlPeer> {
    // Subscribe first so the node's first heartbeat is seen.
    const peer = await new NatsMediaControlPeer(this.nc, {
      nodeId: this.media.nodeId,
      claimCalls: this.claimCalls
    }).open();
    await this.media.start();
    if (this.dialOutcome) await this.media.callee(this.dialOutcome);
    return peer;
  }

  stop() {
    return this.media.stop();
  }

  async caller(action: CallerAction) {
    if (action.call) await this.media.call(action.call);
    if (action.dtmf) await this.media.dtmf(action.dtmf);
    if (action.audio)
      await this.media.speak(
        action.audio.kind ?? "tone",
        action.audio.ms ?? 500
      );
    if (action.hangup) await this.media.hangup();
    if (action.nodeCrash) this.media.crash();
    if (action.drop) throw new Error("drop is a fake-node action");
  }

  async measure(name: string): Promise<unknown> {
    if (name === "media.sip") return this.media.sip();
    if (name === "media.held") return this.media.held();
    return undefined;
  }
}
