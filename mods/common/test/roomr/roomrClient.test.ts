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
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import {
  createRoomrPool,
  ROOMR_PROTO,
  RoomrError,
  roomrService
} from "../../src/roomr";

describe("@common[roomr] client", function () {
  it("loads the same protos as the pinned Roomr release (npm run sync:roomr copies them)", function () {
    const pinned = path.join(
      require.resolve("@fonoster/roomr"),
      "..",
      "..",
      "protos"
    );
    for (const [from, to] of [
      ["roomr/v1/roomr.proto", "roomr.proto"],
      ["session/v1/session.proto", "session.proto"]
    ]) {
      const copy = path.join(path.dirname(ROOMR_PROTO), to).replace(
        `${path.sep}dist${path.sep}`,
        `${path.sep}src${path.sep}`
      );
      expect(fs.readFileSync(copy, "utf8"), to).to.equal(
        fs.readFileSync(path.join(pinned, from), "utf8")
      );
    }
  });

  it("calls a node with a deadline and reports its status code", async function () {
    const server = new grpc.Server();
    const seen: unknown[] = [];
    server.addService(roomrService(), {
      CreateCall: (
        call: grpc.ServerUnaryCall<Record<string, unknown>, unknown>,
        cb: grpc.sendUnaryData<unknown>
      ) => {
        seen.push(call.request);
        cb(null, { callRef: call.request.callRef, roomRef: "r1" });
      },
      EndCall: (_call: unknown, cb: grpc.sendUnaryData<unknown>) =>
        cb({
          code: grpc.status.NOT_FOUND,
          details: "call_not_found"
        } as grpc.ServiceError),
      // Never answers: the caller's deadline ends it.
      EndRoom: () => undefined
    });
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (e, p) => (e ? reject(e) : resolve(p))
      )
    );
    const addr = `127.0.0.1:${port}`;
    const pool = createRoomrPool({ deadlineMs: 300 });
    try {
      const call = await pool.createCall(addr, {
        callRef: "c1",
        to: { uri: "sip:+1@x", headers: { "X-A": "1" } },
        metadata: { k: "v" }
      });
      expect(call).to.include({
        callRef: "c1",
        roomRef: "r1",
        state: "RINGING"
      });
      expect(seen[0]).to.deep.include({
        callRef: "c1",
        to: {
          uri: "sip:+1@x",
          proxy: "",
          headers: { "X-A": "1" },
          auth: null
        },
        metadata: { k: "v" }
      });
      const notFound = await pool
        .endCall(addr, { callRef: "x" })
        .catch((e) => e);
      expect(notFound).to.be.instanceOf(RoomrError);
      expect(notFound.code).to.equal(grpc.status.NOT_FOUND);
      const late = await pool.endRoom(addr, { roomRef: "r" }).catch((e) => e);
      expect(late.code).to.equal(grpc.status.DEADLINE_EXCEEDED);
    } finally {
      pool.close();
      server.forceShutdown();
    }
  });
});
