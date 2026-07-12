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
import { EventEmitter } from "events";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("@sdk[Calls]", function () {
  it("should not crash when trackCall emits 'error' before the caller iterates statusStream", async function () {
    // Arrange
    const { Calls } = await import("../src/Calls");

    const stream = new EventEmitter();

    class CreateCallResponse {
      getRef(): string {
        return "00000000-0000-0000-0000-000000000000";
      }
    }
    const createCallResponse = new CreateCallResponse();

    const client = {
      createCall: (
        _req: unknown,
        _metadata: unknown,
        callback: (err: Error | null, res: unknown) => void
      ) => callback(null, createCallResponse),
      trackCall: () => stream
    };

    const fonosterClient = {
      getCallsClient: () => client,
      getMetadata: () => ({})
    };

    // Act
    const calls = new Calls(fonosterClient as never);
    const { statusStream } = await calls.createCall({
      from: "+18287854037",
      to: "+17853178070",
      appRef: "00000000-0000-0000-0000-000000000000"
    });

    // Simulate the stream failing before the caller ever starts iterating
    // (e.g. a "14 UNAVAILABLE: stream timeout" arriving while the caller is
    // still doing other work). Previously this crashed the process because
    // no "error" listener was attached yet.
    stream.emit("error", new Error("14 UNAVAILABLE: stream timeout"));

    // Assert: the error surfaces as a rejection from the async generator,
    // not as an unhandled EventEmitter exception.
    const iterate = async () => {
      // eslint-disable-next-line no-loops/no-loops
      for await (const _status of statusStream) {
        // no-op
      }
    };

    await expect(iterate()).to.be.rejectedWith(
      "14 UNAVAILABLE: stream timeout"
    );
  });

  it("should yield statuses received before consumption starts", async function () {
    // Arrange
    const { Calls } = await import("../src/Calls");

    const stream = new EventEmitter();

    class CreateCallResponse {
      getRef(): string {
        return "00000000-0000-0000-0000-000000000000";
      }
    }
    const createCallResponse = new CreateCallResponse();

    const client = {
      createCall: (
        _req: unknown,
        _metadata: unknown,
        callback: (err: Error | null, res: unknown) => void
      ) => callback(null, createCallResponse),
      trackCall: () => stream
    };

    const fonosterClient = {
      getCallsClient: () => client,
      getMetadata: () => ({})
    };

    // Act
    const calls = new Calls(fonosterClient as never);
    const { statusStream } = await calls.createCall({
      from: "+18287854037",
      to: "+17853178070",
      appRef: "00000000-0000-0000-0000-000000000000"
    });

    stream.emit("data", { toObject: () => ({ status: 2 }) });
    stream.emit("end");

    const statuses = [];
    // eslint-disable-next-line no-loops/no-loops
    for await (const status of statusStream) {
      statuses.push(status);
    }

    // Assert
    expect(statuses).to.deep.equal([{ status: "ANSWER" }]);
  });
});
