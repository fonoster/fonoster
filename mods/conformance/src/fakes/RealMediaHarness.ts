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
import { PhoneStatus } from "@fonoster/roomr/fake";
import { Peer } from "../runner/Peer";
import { FakesHarness, FakesHarnessOptions } from "./FakesHarness";

/**
 * AppBridge's fakes (app, providers) and a real Roomr node with its phone (roomr-fake): the
 * voice-session scenarios cross real SIP, RTP and the control stream. Since extract-roomr every
 * FakesHarness does; this one adds the phone's codec choice and its status.
 */
export class RealMediaHarness extends FakesHarness {
  constructor(options: FakesHarnessOptions = {}) {
    super(options);
  }

  /** The AppBridge under test's session endpoint: the node opens each call's control stream there. */
  set sessionEndpoint(endpoint: string) {
    this.roomrNode.configure({ endpoint });
  }

  /** Kept for suites that pass AppBridge's tap: the node's commands come from roomr-fake. */
  readonly tap = () => undefined;

  /** The phone's side of the last call (codec, what it heard since `since`). */
  readonly media = {
    status: async (since?: number): Promise<PhoneStatus> => {
      const c = this.roomrNode.call();
      const s = await c?.fake.status(since);
      if (!s?.phone) throw new Error("the phone has no call");
      return s.phone;
    }
  };

  async offerCallAndAccept(
    timeoutMs = 5000,
    options: { codecs?: string[]; callRef?: string } = {}
  ): Promise<Peer> {
    const mark = this.connectionMark();
    await this.roomrNode.offerCall({
      appRef: this.roomrNode.options.appRef ?? "app-1",
      from: this.call?.from,
      to: this.call?.to,
      callRef: options.callRef,
      codecs: options.codecs
    });
    const peer = await this.acceptSession(mark, timeoutMs);
    if (this.reachesNoApp) return peer;
    await this.roomrNode.answered(undefined, timeoutMs);
    return peer;
  }
}
