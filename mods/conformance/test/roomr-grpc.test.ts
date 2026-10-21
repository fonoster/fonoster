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
import { Roomr } from "@fonoster/common";
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { FakeRoomr } from "../src";

// The controller-side fake Roomr node keeps the node's CreateCall contract (the apiserver's
// placement suites run against it). The Go node's Roomr service runs in the media-control
// scenarios (media-control-go.test.ts: create-call-*, dialed-party-busy, cancel-while-ringing,
// call-ref-header, capacity-retry, room-*), which replaced this file's Go-node suite.

const rejected = (p: Promise<unknown>) =>
  p.then(
    () => expect.fail("accepted"),
    (e: Roomr.RoomrError) => e
  );

describe("@conformance fake Roomr node (controller fakes)", function () {
  it("keeps the node's CreateCall contract: dedupe, ALREADY_EXISTS and the room limit", async function () {
    const full = new FakeRoomr({ maxRooms: 1 });
    const roomr = Roomr.createRoomrPool();
    try {
      await full.start();
      const request = { callRef: "c1", to: { uri: "sip:+1@x" } };
      const first = await roomr.createCall(full.controlAddr, request);
      expect(await roomr.createCall(full.controlAddr, request)).to.include({
        callRef: first.callRef,
        roomRef: first.roomRef
      });
      const exists = await rejected(
        roomr.createCall(full.controlAddr, {
          ...request,
          to: { uri: "sip:+2@x" }
        })
      );
      expect(exists.code).to.equal(status.ALREADY_EXISTS);
      const atLimit = await rejected(
        roomr.createCall(full.controlAddr, {
          callRef: "c2",
          to: { uri: "sip:+1@x" }
        })
      );
      expect(atLimit.code).to.equal(status.RESOURCE_EXHAUSTED);
      full.failNext("EndCall", status.INTERNAL);
      expect(
        (await rejected(roomr.endCall(full.controlAddr, { callRef: "c1" })))
          .code
      ).to.equal(status.INTERNAL);
    } finally {
      roomr.close();
      await full.stop();
    }
  });
});
